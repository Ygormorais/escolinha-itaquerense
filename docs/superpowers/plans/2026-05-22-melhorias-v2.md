# Melhorias v2 — E.C. Itaquerense

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar gráfico Recharts no dashboard, botão de geração de mensalidades, página de detalhe do aluno e melhorias visuais nos módulos novos.

**Architecture:** Todas as features seguem o padrão existente — server components com queries Prisma diretas, server actions para mutações, componentes client apenas onde há interatividade. Sem API routes novas.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Prisma SQLite, shadcn/ui, Recharts, date-fns, lucide-react

---

## Mapa de Arquivos

| Arquivo | Ação |
|---------|------|
| `components/dashboard/chart-receita-custos.tsx` | Criar — BarChart client component |
| `app/page.tsx` | Modificar — adicionar agregação 6 meses + chart |
| `app/actions/pagamentos.ts` | Modificar — adicionar `gerarMensalidadesMes` |
| `app/pagamentos/pagamentos-client.tsx` | Modificar — botão + dialog de geração |
| `app/alunos/[id]/page.tsx` | Criar — detalhe do aluno |
| `app/alunos/alunos-client.tsx` | Modificar — nome vira link |
| `app/inadimplencia/page.tsx` | Modificar — melhorias visuais |
| `app/caixa/page.tsx` | Modificar — month-picker inline |
| `app/recibos/page.tsx` | Modificar — overflow + spacing |

---

## Task 1: Gráfico Recharts no Dashboard

**Files:**
- Create: `components/dashboard/chart-receita-custos.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Criar `components/dashboard/chart-receita-custos.tsx`**

```tsx
"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ChartData = { mes: string; recebido: number; custos: number }

export function ChartReceitaCustos({ data }: { data: ChartData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita vs Custos — Últimos 6 meses</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
              }
            />
            <Tooltip
              formatter={(v: number) =>
                v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              }
            />
            <Legend />
            <Bar dataKey="recebido" name="Recebido" fill="#C62828" radius={[4, 4, 0, 0]} />
            <Bar dataKey="custos" name="Custos" fill="#94A3B8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Modificar `app/page.tsx` — adicionar imports**

No topo do arquivo, adicionar após os imports existentes:

```tsx
import { subMonths, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChartReceitaCustos } from "@/components/dashboard/chart-receita-custos"
```

- [ ] **Step 3: Modificar `app/page.tsx` — adicionar queries dos últimos 6 meses**

No corpo do `DashboardPage`, adicionar dentro do `Promise.all` existente (ou em paralelo após ele):

```tsx
  const sixMonthsAgo = subMonths(startOfMonth(now), 5)

  const [pagamentosChart, custosChart] = await Promise.all([
    db.pagamento.findMany({
      where: { dataPagamento: { gte: sixMonthsAgo } },
      select: { dataPagamento: true, valorRecebido: true },
    }),
    db.custo.findMany({
      where: { data: { gte: sixMonthsAgo } },
      select: { data: true, valor: true },
    }),
  ])

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    return format(d, "yyyy-MM")
  })

  const chartData = last6Months.map((mes) => {
    const recebido = pagamentosChart
      .filter((p) => p.dataPagamento && format(p.dataPagamento, "yyyy-MM") === mes)
      .reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
    const custos = custosChart
      .filter((c) => format(c.data, "yyyy-MM") === mes)
      .reduce((s, c) => s + c.valor, 0)
    const [year, month] = mes.split("-")
    const label = format(new Date(Number(year), Number(month) - 1), "MMM/yy", { locale: ptBR })
    return { mes: label, recebido, custos }
  })
```

- [ ] **Step 4: Modificar `app/page.tsx` — renderizar o gráfico**

No JSX, após o grid de StatCards e antes dos cards de tabela (últimos pagamentos / mensalidades em atraso), adicionar:

```tsx
      <ChartReceitaCustos data={chartData} />
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd escolinha-itaquerense && npx tsc --noEmit 2>&1 | grep "page.tsx\|chart-receita"
```

Esperado: sem erros nos arquivos modificados.

- [ ] **Step 6: Commit**

```bash
git add components/dashboard/chart-receita-custos.tsx app/page.tsx
git commit -m "feat: gráfico receita vs custos no dashboard"
```

---

## Task 2: Geração de Mensalidades

**Files:**
- Modify: `app/actions/pagamentos.ts`
- Modify: `app/pagamentos/pagamentos-client.tsx`

- [ ] **Step 1: Adicionar `gerarMensalidadesMes` em `app/actions/pagamentos.ts`**

Adicionar após a função `registrarPagamento` existente:

```ts
export async function gerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number }> {
  const alunos = await db.aluno.findMany({ where: { status: "Ativo" } })

  let criados = 0
  let ignorados = 0

  for (const aluno of alunos) {
    const existe = await db.pagamento.findFirst({
      where: { alunoId: aluno.id, mesReferencia: mes },
    })
    if (existe) {
      ignorados++
      continue
    }
    const [ano, mesNum] = mes.split("-").map(Number)
    await db.pagamento.create({
      data: {
        alunoId: aluno.id,
        mesReferencia: mes,
        dataVencimento: new Date(ano, mesNum - 1, 10),
      },
    })
    criados++
  }

  revalidatePath("/pagamentos")
  revalidatePath("/")

  return { criados, ignorados }
}
```

- [ ] **Step 2: Modificar `app/pagamentos/pagamentos-client.tsx` — adicionar imports**

Adicionar ao bloco de imports existente:

```tsx
import { useState, useTransition } from "react"
import { PlusCircleIcon } from "lucide-react"
import { gerarMensalidadesMes } from "@/app/actions/pagamentos"
```

(`useState` já pode existir — verificar e não duplicar)

- [ ] **Step 3: Modificar `app/pagamentos/pagamentos-client.tsx` — adicionar botão no componente `PagamentosClient`**

Dentro do componente `PagamentosClient`, adicionar estado e handler antes do `return`:

```tsx
  const [gerando, startGerando] = useTransition()
  const [resultado, setResultado] = useState<{ criados: number; ignorados: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleGerar() {
    startGerando(async () => {
      const r = await gerarMensalidadesMes(mes)
      setResultado(r)
      setConfirmOpen(false)
      router.refresh()
    })
  }
```

- [ ] **Step 4: Modificar `app/pagamentos/pagamentos-client.tsx` — adicionar botão + dialog no JSX**

No JSX do `PagamentosClient`, após `<div className="flex items-center gap-4">` e antes do `</div>` de fechamento do filtro de mês, adicionar o botão e dialog (inserir entre o input de mês e o total):

```tsx
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={gerando}
        >
          <PlusCircleIcon className="size-4" />
          Gerar Mensalidades
        </Button>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Mensalidades</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Criar mensalidades de <strong>{mes}</strong> para todos os alunos ativos que ainda não têm registro neste mês?
            </p>
            {resultado && (
              <p className="text-sm font-medium text-green-700">
                ✅ {resultado.criados} criada(s), {resultado.ignorados} já existia(m).
              </p>
            )}
            <DialogFooter showCloseButton>
              <Button
                onClick={handleGerar}
                disabled={gerando}
                className="bg-brand-800 text-white hover:bg-brand-900"
              >
                {gerando ? "Gerando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "pagamentos"
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add app/actions/pagamentos.ts app/pagamentos/pagamentos-client.tsx
git commit -m "feat: geração automática de mensalidades por mês"
```

---

## Task 3: Página de Detalhe do Aluno

**Files:**
- Create: `app/alunos/[id]/page.tsx`
- Modify: `app/alunos/alunos-client.tsx`

- [ ] **Step 1: Criar `app/alunos/[id]/page.tsx`**

```tsx
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { calcStatus, formatMoney, formatDate } from "@/lib/utils"

const statusPagStyle: Record<string, string> = {
  "Pago": "bg-green-100 text-green-800",
  "Pendente": "bg-gray-100 text-gray-600",
  "Em atraso": "bg-yellow-100 text-yellow-800",
  "Atraso grave": "bg-red-100 text-red-800",
}

const presencaStyle: Record<string, string> = {
  Presente: "bg-green-100 text-green-800",
  Ausente: "bg-red-100 text-red-800",
  Justificado: "bg-yellow-100 text-yellow-800",
}

export default async function AlunoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const aluno = await db.aluno.findUnique({
    where: { id: Number(id) },
    include: {
      pagamentos: { orderBy: { dataVencimento: "desc" } },
      frequencias: { orderBy: { data: "desc" }, take: 30 },
    },
  })

  if (!aluno) notFound()

  const totalPago = aluno.pagamentos
    .filter((p) => p.dataPagamento)
    .reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
  const pendentes = aluno.pagamentos.filter((p) => !p.dataPagamento).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Link
          href="/alunos"
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para Alunos
        </Link>
        <PageHeader
          title={aluno.nome}
          description={`${aluno.turma} · ${aluno.horario}`}
          action={
            <Badge
              className={
                aluno.status === "Ativo"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {aluno.status}
            </Badge>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Responsável", aluno.responsavel],
              ["Telefone", aluno.telefone],
              ["Email", aluno.email],
              ["Nascimento", formatDate(aluno.dataNascimento)],
              ["Matrícula", formatDate(aluno.dataMatricula)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-muted pb-2 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Mensalidade", formatMoney(aluno.mensalidade)],
              ["Total Pago", formatMoney(totalPago)],
              [`Pendências`, `${pendentes} mês(es)`],
              ["Total Registros", String(aluno.pagamentos.length)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-muted pb-2 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pago em</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluno.pagamentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum registro de pagamento
                  </TableCell>
                </TableRow>
              )}
              {aluno.pagamentos.map((p) => {
                const status = calcStatus(p.dataVencimento, p.dataPagamento)
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.mesReferencia}</TableCell>
                    <TableCell>{formatDate(p.dataVencimento)}</TableCell>
                    <TableCell>{p.dataPagamento ? formatDate(p.dataPagamento) : "—"}</TableCell>
                    <TableCell>{p.formaPagamento ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {p.valorRecebido ? formatMoney(p.valorRecebido) : formatMoney(aluno.mensalidade)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusPagStyle[status] ?? ""}`}
                      >
                        {status}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequência (últimos 30 registros)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Presença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluno.frequencias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Nenhum registro de frequência
                  </TableCell>
                </TableRow>
              )}
              {aluno.frequencias.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{format(f.data, "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${presencaStyle[f.presenca] ?? ""}`}
                    >
                      {f.presenca}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Modificar `app/alunos/alunos-client.tsx` — adicionar import de Link**

Adicionar no topo, junto aos imports existentes:

```tsx
import Link from "next/link"
```

- [ ] **Step 3: Modificar `app/alunos/alunos-client.tsx` — nome do aluno vira link**

Localizar a célula do nome (linha com `{aluno.nome}` dentro de `<TableCell className="font-medium">`):

```tsx
// ANTES:
<TableCell className="font-medium">{aluno.nome}</TableCell>

// DEPOIS:
<TableCell className="font-medium">
  <Link
    href={`/alunos/${aluno.id}`}
    className="hover:underline hover:text-brand-800"
  >
    {aluno.nome}
  </Link>
</TableCell>
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "alunos"
```

Esperado: sem erros nos arquivos de alunos.

- [ ] **Step 5: Commit**

```bash
git add "app/alunos/[id]/page.tsx" app/alunos/alunos-client.tsx
git commit -m "feat: página de detalhe do aluno com histórico de pagamentos e frequência"
```

---

## Task 4: Melhorias Visuais

**Files:**
- Modify: `app/inadimplencia/page.tsx`
- Modify: `app/caixa/page.tsx`
- Modify: `app/recibos/page.tsx`

- [ ] **Step 1: Melhorar `app/inadimplencia/page.tsx` — telefone com ícone + badge com ícone**

Adicionar ao bloco de imports existente:

```tsx
import { Phone, AlertTriangle } from "lucide-react"
```

Localizar o link de telefone e substituir:

```tsx
// ANTES:
<TableCell><a href={`tel:${r.aluno.telefone}`} className="text-brand-600 text-xs underline">Ligar</a></TableCell>

// DEPOIS:
<TableCell>
  <a
    href={`tel:${r.aluno.telefone}`}
    className="inline-flex items-center gap-1 text-xs font-medium text-brand-800 hover:underline"
  >
    <Phone className="size-3" />
    {r.aluno.telefone}
  </a>
</TableCell>
```

Localizar o Badge de nível e substituir:

```tsx
// ANTES:
<Badge variant="destructive">Crítico</Badge>
// e
<Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>

// DEPOIS:
<Badge variant="destructive" className="inline-flex items-center gap-1">
  <AlertTriangle className="size-3" /> Crítico
</Badge>
// e
<Badge className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800">
  <AlertTriangle className="size-3" /> Atenção
</Badge>
```

- [ ] **Step 2: Melhorar `app/caixa/page.tsx` — MonthPicker inline no PageHeader**

Atualizar a chamada do `PageHeader` para passar o `MonthPicker` como `action`:

```tsx
// ANTES (exemplo aproximado):
<PageHeader title="Caixa" description="..." />
<MonthPicker mes={mes} />

// DEPOIS:
<PageHeader
  title="Caixa"
  description="Resumo financeiro da escolinha"
  action={<MonthPicker mes={mes} />}
/>
```

Remover qualquer bloco wrapper separado em torno do `MonthPicker`.

- [ ] **Step 3: Melhorar `app/recibos/page.tsx` — overflow + spacing**

Localizar o wrapper do preview do recibo e adicionar `overflow-x-auto`:

```tsx
// ANTES:
<div className="... w-[680px] ...">

// DEPOIS:
<div className="... w-full max-w-[680px] overflow-x-auto ...">
```

Localizar o formulário e aumentar espaçamento vertical se estiver com `gap-4`, alterar para `gap-y-5`:

```tsx
// ANTES:
<div className="grid grid-cols-2 gap-4 ...">

// DEPOIS:
<div className="grid grid-cols-2 gap-x-4 gap-y-5 ...">
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "inadimplencia\|caixa\|recibos"
```

Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add app/inadimplencia/page.tsx app/caixa/page.tsx app/recibos/page.tsx
git commit -m "feat: melhorias visuais em inadimplência, caixa e recibos"
```
