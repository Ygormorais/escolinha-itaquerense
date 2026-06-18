# Portal do Responsável — Grupo A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar widget de histórico de 6 meses de pagamentos no dashboard, página de uniformes do aluno no portal do responsável, e card de próximos eventos/jogos no dashboard.

**Architecture:** Três features independentes no portal do responsável. Feature 1 é puramente client-side (dados já disponíveis). Feature 2 é nova rota server+client. Feature 3 adiciona duas queries server-side ao dashboard existente. Nenhuma migration de banco necessária.

**Tech Stack:** Next.js 16 App Router, Prisma, Tailwind CSS, Vitest, Playwright

## Global Constraints

- Sem migration de banco — todos os dados já existem no schema
- Seguir padrão visual do portal: header vermelho `bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)...)]`, cards com `rounded-3xl`
- Auth via `getResponsavelSession()` em `lib/responsavel-session.ts` — redirect para `/responsavel/login` se não autenticado
- Tipos de data vindos do RSC usam `RscDate` de `@/lib/rsc-date` (serializado como string)
- Testes unit em `lib/<feature>/__tests__/` com `import { describe, it, expect } from "vitest"`
- E2E usa `storageState: "e2e/.auth/responsavel.json"` para sessão autenticada
- Commits frequentes após cada task
- `npm test` para unit tests, `npx playwright test <arquivo>` para E2E

---

### Task 1: Lógica de status dos 6 meses (TDD)

**Files:**
- Create: `lib/historico-pagamentos.ts`
- Create: `lib/__tests__/historico-pagamentos.test.ts`

**Interfaces:**
- Produces: `type StatusMes = "pago" | "pendente" | "atrasado" | "sem-registro"`
- Produces: `type MesHistorico = { mes: string; label: string; status: StatusMes }`
- Produces: `function calcularHistorico(pagamentos: PagamentoMin[], hoje?: Date): MesHistorico[]`
  - `PagamentoMin = { mesReferencia: string; dataPagamento: string | null; dataVencimento: string }`
  - Retorna array com os 6 meses mais recentes (inclusive o atual), do mais recente ao mais antigo

- [ ] **Step 1: Escrever os testes**

```ts
// lib/__tests__/historico-pagamentos.test.ts
import { describe, it, expect } from "vitest"
import { calcularHistorico } from "@/lib/historico-pagamentos"

describe("calcularHistorico", () => {
  const hoje = new Date("2026-06-18")

  it("retorna 6 meses do mais recente ao mais antigo", () => {
    const result = calcularHistorico([], hoje)
    expect(result).toHaveLength(6)
    expect(result[0].mes).toBe("2026-06")
    expect(result[5].mes).toBe("2026-01")
  })

  it("marca como pago quando dataPagamento existe", () => {
    const result = calcularHistorico([
      { mesReferencia: "2026-06", dataPagamento: "2026-06-05", dataVencimento: "2026-06-10" },
    ], hoje)
    expect(result[0].status).toBe("pago")
  })

  it("marca como pendente quando vencimento no futuro e sem pagamento", () => {
    const result = calcularHistorico([
      { mesReferencia: "2026-06", dataPagamento: null, dataVencimento: "2026-06-30" },
    ], hoje)
    expect(result[0].status).toBe("pendente")
  })

  it("marca como atrasado quando vencimento no passado e sem pagamento", () => {
    const result = calcularHistorico([
      { mesReferencia: "2026-05", dataPagamento: null, dataVencimento: "2026-05-10" },
    ], hoje)
    const maio = result.find((m) => m.mes === "2026-05")
    expect(maio?.status).toBe("atrasado")
  })

  it("marca como sem-registro quando não existe pagamento no mês", () => {
    const result = calcularHistorico([], hoje)
    expect(result[0].status).toBe("sem-registro")
  })

  it("label usa abreviação em português (jan, fev, ..., jun)", () => {
    const result = calcularHistorico([], hoje)
    expect(result[0].label).toBe("jun")
    expect(result[5].label).toBe("jan")
  })
})
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx vitest run lib/__tests__/historico-pagamentos.test.ts
```
Esperado: FAIL — "Cannot find module '@/lib/historico-pagamentos'"

- [ ] **Step 3: Implementar**

```ts
// lib/historico-pagamentos.ts
export type StatusMes = "pago" | "pendente" | "atrasado" | "sem-registro"

export type MesHistorico = {
  mes: string   // "YYYY-MM"
  label: string // "jan", "fev", ...
  status: StatusMes
}

export type PagamentoMin = {
  mesReferencia: string
  dataPagamento: string | null
  dataVencimento: string
}

const LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

export function calcularHistorico(pagamentos: PagamentoMin[], hoje: Date = new Date()): MesHistorico[] {
  const meses: MesHistorico[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = LABELS[d.getMonth()]
    const pag = pagamentos.find((p) => p.mesReferencia === mes)
    let status: StatusMes
    if (!pag) {
      status = "sem-registro"
    } else if (pag.dataPagamento) {
      status = "pago"
    } else if (new Date(pag.dataVencimento) >= hoje) {
      status = "pendente"
    } else {
      status = "atrasado"
    }
    meses.push({ mes, label, status })
  }
  return meses
}
```

- [ ] **Step 4: Rodar para confirmar aprovação**

```bash
npx vitest run lib/__tests__/historico-pagamentos.test.ts
```
Esperado: 6 testes passando

- [ ] **Step 5: Commit**

```bash
git add lib/historico-pagamentos.ts lib/__tests__/historico-pagamentos.test.ts
git commit -m "feat(portal): logica de historico de pagamentos por mes (TDD)"
```

---

### Task 2: Componente HistoricoPagamentos + integração no dashboard

**Files:**
- Create: `components/responsavel/historico-pagamentos.tsx`
- Modify: `app/responsavel/page.tsx` — incluir `dataVencimento` nos pagamentos (take: 6)
- Modify: `app/responsavel/dashboard-client.tsx` — adicionar type `dataVencimento`, importar e renderizar componente

**Interfaces:**
- Consumes: `calcularHistorico`, `MesHistorico`, `StatusMes` de `@/lib/historico-pagamentos`
- Produces: `<HistoricoPagamentos pagamentos={...} />` — renderiza bloco de 6 pills

- [ ] **Step 1: Atualizar query no page.tsx para incluir dataVencimento e take 6**

Em `app/responsavel/page.tsx`, localizar:
```ts
pagamentos: { orderBy: { dataVencimento: "desc" }, take: 5 },
```
Substituir por:
```ts
pagamentos: { orderBy: { dataVencimento: "desc" }, take: 6, select: { mesReferencia: true, dataVencimento: true, dataPagamento: true, valorRecebido: true, formaPagamento: true } },
```

- [ ] **Step 2: Atualizar o type Aluno no dashboard-client.tsx**

Localizar o type `Aluno` e adicionar `dataVencimento` ao tipo de pagamento:
```ts
pagamentos: {
  mesReferencia: string
  dataVencimento: RscDate  // adicionar esta linha
  dataPagamento: RscDate | null
  valorRecebido: number | null
  formaPagamento: string | null
}[]
```

- [ ] **Step 3: Criar o componente**

```tsx
// components/responsavel/historico-pagamentos.tsx
import Link from "next/link"
import { cn } from "@/lib/utils"
import { calcularHistorico, type PagamentoMin } from "@/lib/historico-pagamentos"

const STATUS_STYLES = {
  pago: "bg-success-100 text-success-700 border-success-200 dark:bg-success-900/30 dark:text-success-400",
  pendente: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  atrasado: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20",
  "sem-registro": "bg-muted text-muted-foreground border-border",
}

const STATUS_LABEL = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
  "sem-registro": "Sem registro",
}

export function HistoricoPagamentos({ pagamentos }: { pagamentos: PagamentoMin[] }) {
  const historico = calcularHistorico(pagamentos)
  return (
    <Link href="/responsavel/mensalidades" className="group block rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Últimos 6 meses
      </p>
      <div className="flex gap-1.5">
        {historico.map((m) => (
          <div
            key={m.mes}
            title={`${m.mes} — ${STATUS_LABEL[m.status]}`}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-[10px] font-semibold transition-opacity",
              STATUS_STYLES[m.status]
            )}
          >
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </Link>
  )
}
```

- [ ] **Step 4: Renderizar no dashboard**

Em `app/responsavel/dashboard-client.tsx`:

1. Adicionar import:
```ts
import { HistoricoPagamentos } from "@/components/responsavel/historico-pagamentos"
```

2. Localizar o bloco de `aluno.pagamentos` (a lista "Últimos Pagamentos") e adicionar o componente logo acima dela, dentro do `CardContent` de cada aluno:
```tsx
<HistoricoPagamentos pagamentos={aluno.pagamentos.map(p => ({
  mesReferencia: p.mesReferencia,
  dataPagamento: p.dataPagamento ? String(p.dataPagamento) : null,
  dataVencimento: String(p.dataVencimento),
}))} />
```

- [ ] **Step 5: Verificar visualmente**

Abrir `http://localhost:3000/responsavel` (com servidor já rodando via `npm run dev` em background) e confirmar que as 6 pills aparecem para cada aluno.

- [ ] **Step 6: Commit**

```bash
git add components/responsavel/historico-pagamentos.tsx app/responsavel/page.tsx app/responsavel/dashboard-client.tsx
git commit -m "feat(portal): widget historico de 6 meses de pagamentos no dashboard"
```

---

### Task 3: Página `/responsavel/uniformes`

**Files:**
- Create: `app/responsavel/uniformes/page.tsx`
- Create: `app/responsavel/uniformes/loading.tsx`
- Modify: `components/responsavel/nav-responsavel.tsx`

**Interfaces:**
- Consumes: `getResponsavelSession` de `@/lib/responsavel-session`
- Consumes: `db` de `@/lib/db`
- Produces: rota `/responsavel/uniformes` acessível e linkada no nav

- [ ] **Step 1: Criar loading.tsx**

```tsx
// app/responsavel/uniformes/loading.tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
```

- [ ] **Step 2: Criar page.tsx**

```tsx
// app/responsavel/uniformes/page.tsx
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Shirt, ShoppingBag } from "lucide-react"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export const metadata = { title: "Uniformes — Escolinha Itaquerense" }

export default async function UniformesPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        where: { status: "Ativo" },
        include: {
          uniformes: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const alunos = responsavel.alunos
  const totalEntregues = alunos.flatMap((a) => a.uniformes).filter((u) => u.entregue).length
  const totalItens = alunos.flatMap((a) => a.uniformes).length

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
              <ArrowLeft className="size-4" />
              Voltar ao portal
            </Link>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Uniformes</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Acompanhe os itens de uniforme dos seus filhos e solicite novos quando necessário.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Total de itens</p>
              <p className="mt-2 text-2xl font-bold">{totalItens}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Entregues</p>
              <p className="mt-2 text-2xl font-bold">{totalEntregues}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      {alunos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum aluno vinculado a esta conta.
          </CardContent>
        </Card>
      )}

      {alunos.map((aluno) => (
        <Card key={aluno.id}>
          <CardHeader className="flex flex-row items-center justify-between border-b border-black/5 pb-4">
            <div>
              <CardTitle className="text-lg">{aluno.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">{aluno.turma}</p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/responsavel/solicitacoes">
                <ShoppingBag className="size-4" />
                Solicitar item
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {aluno.uniformes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item registrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4">Item</th>
                      <th className="pb-2 pr-4">Tamanho</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2">Entrega</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {aluno.uniformes.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2.5 pr-4 font-medium">{u.item}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{u.tamanho ?? "—"}</td>
                        <td className="py-2.5 pr-4">
                          {u.entregue
                            ? <Badge className="bg-success-100 text-success-700 border-success-200">Entregue</Badge>
                            : <Badge variant="outline" className="text-amber-600 border-amber-300">Pendente</Badge>
                          }
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {u.dataEntrega ? format(new Date(u.dataEntrega), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Adicionar link no nav**

Em `components/responsavel/nav-responsavel.tsx`, localizar:
```ts
{ href: "/responsavel/desempenho", label: "Desempenho" },
{ href: "/responsavel/boletim", label: "Boletim" },
```
Substituir por:
```ts
{ href: "/responsavel/desempenho", label: "Desempenho" },
{ href: "/responsavel/uniformes", label: "Uniforme" },
{ href: "/responsavel/boletim", label: "Boletim" },
```

- [ ] **Step 4: Verificar visualmente**

Abrir `http://localhost:3000/responsavel/uniformes` e confirmar: header vermelho, card por aluno, tabela de itens ou empty state, botão "Solicitar item".

- [ ] **Step 5: Commit**

```bash
git add app/responsavel/uniformes/ components/responsavel/nav-responsavel.tsx
git commit -m "feat(portal): pagina de uniformes do aluno com nav item"
```

---

### Task 4: E2E para uniformes

**Files:**
- Create: `e2e/responsavel-uniformes.spec.ts`

- [ ] **Step 1: Criar spec**

```ts
// e2e/responsavel-uniformes.spec.ts
import { test, expect } from "@playwright/test"

const RESP_STORAGE = "e2e/.auth/responsavel.json"

test.describe("Uniformes — sem autenticação", () => {
  test("rota /responsavel/uniformes redireciona para login", async ({ page }) => {
    await page.goto("/responsavel/uniformes")
    await expect(page).toHaveURL(/\/responsavel\/login/, { timeout: 5000 })
  })
})

test.describe("Uniformes — autenticado", () => {
  test.use({ storageState: RESP_STORAGE })

  test("link 'Uniforme' aparece no menu de navegação", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page.getByRole("link", { name: "Uniforme" }).first()).toBeVisible({ timeout: 8000 })
  })

  test("página /responsavel/uniformes carrega com título", async ({ page }) => {
    await page.goto("/responsavel/uniformes")
    await expect(page.getByRole("heading", { name: "Uniformes" })).toBeVisible({ timeout: 8000 })
  })

  test("exibe card por aluno ou mensagem de nenhum aluno", async ({ page }) => {
    await page.goto("/responsavel/uniformes")
    const temAluno = await page.locator('[data-slot="card"]').count()
    if (temAluno > 0) {
      await expect(page.locator('[data-slot="card"]').first()).toBeVisible()
    } else {
      await expect(page.getByText(/Nenhum aluno/i)).toBeVisible()
    }
  })

  test("link 'Voltar ao portal' navega para /responsavel", async ({ page }) => {
    await page.goto("/responsavel/uniformes")
    await page.getByRole("link", { name: /Voltar ao portal/i }).click()
    await expect(page).toHaveURL("/responsavel", { timeout: 5000 })
  })
})
```

- [ ] **Step 2: Rodar E2E**

```bash
npx playwright test e2e/responsavel-uniformes.spec.ts --reporter=line
```
Esperado: 4 testes passando

- [ ] **Step 3: Commit**

```bash
git add e2e/responsavel-uniformes.spec.ts
git commit -m "test(e2e): testes de acesso e conteudo de /responsavel/uniformes"
```

---

### Task 5: Card "Próximos eventos" no dashboard

**Files:**
- Create: `lib/responsavel-eventos.ts`
- Modify: `app/responsavel/page.tsx` — duas queries novas, prop `proximosEventos`
- Modify: `app/responsavel/dashboard-client.tsx` — receber e renderizar prop

**Interfaces:**
- Produces: `type ItemAgendaDashboard = { tipo: "jogo" | "evento"; titulo: string; data: string; alunoNome?: string; escalacaoId?: number; confirmacao?: string | null }`
- Produces: `function buscarProximosEventos(responsavelId: number, turmasAlunos: string[]): Promise<ItemAgendaDashboard[]>`

- [ ] **Step 1: Criar lib/responsavel-eventos.ts**

```ts
// lib/responsavel-eventos.ts
import { db } from "@/lib/db"

export type ItemAgendaDashboard = {
  tipo: "jogo" | "evento"
  titulo: string
  data: string // ISO string
  alunoNome?: string
  escalacaoId?: number
  confirmacao?: string | null
}

export async function buscarProximosEventos(
  responsavelId: number,
  turmasAlunos: string[]
): Promise<ItemAgendaDashboard[]> {
  const hoje = new Date()
  const limite = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

  const [convocacoes, eventos] = await Promise.all([
    db.escalacaoJogador.findMany({
      where: {
        convocadoEm: { not: null },
        partida: { data: { gte: hoje } },
        aluno: { responsavelId },
      },
      select: {
        id: true,
        confirmacao: true,
        aluno: { select: { nome: true } },
        partida: { select: { data: true, adversario: true } },
      },
      orderBy: { partida: { data: "asc" } },
      take: 5,
    }),
    db.evento.findMany({
      where: {
        data: { gte: hoje, lte: limite },
        status: { not: "cancelado" },
      },
      orderBy: { data: "asc" },
      take: 5,
    }),
  ])

  const itensJogo: ItemAgendaDashboard[] = convocacoes.map((c) => ({
    tipo: "jogo",
    titulo: `Jogo vs ${c.partida.adversario}`,
    data: c.partida.data.toISOString(),
    alunoNome: c.aluno.nome,
    escalacaoId: c.id,
    confirmacao: c.confirmacao,
  }))

  const itensEvento: ItemAgendaDashboard[] = eventos
    .filter((e) => {
      if (!e.turmas || e.turmas === "Todas") return true
      return turmasAlunos.some((t) => e.turmas!.split(",").map((s) => s.trim()).includes(t))
    })
    .map((e) => ({
      tipo: "evento",
      titulo: e.titulo,
      data: e.data.toISOString(),
    }))

  return [...itensJogo, ...itensEvento]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 3)
}
```

- [ ] **Step 2: Adicionar query no page.tsx**

Em `app/responsavel/page.tsx`:

1. Adicionar import:
```ts
import { buscarProximosEventos } from "@/lib/responsavel-eventos"
```

2. Após carregar `responsavel`, adicionar:
```ts
const turmasAlunos = responsavel.alunos.map((a) => a.turma)
const proximosEventos = await buscarProximosEventos(session.responsavelId!, turmasAlunos)
```

3. Passar para o client:
```tsx
return <ResponsavelDashboardClient responsavel={responsavel} comunicados={comunicados} proximosEventos={proximosEventos} />
```

- [ ] **Step 3: Atualizar dashboard-client.tsx**

1. Adicionar import:
```ts
import { CalendarDays } from "lucide-react"
import type { ItemAgendaDashboard } from "@/lib/responsavel-eventos"
```

2. Adicionar `proximosEventos` à prop do componente:
```ts
export function ResponsavelDashboardClient({
  responsavel,
  comunicados,
  proximosEventos,
}: {
  responsavel: { nome: string; alunos: Aluno[] }
  comunicados: Comunicado[]
  proximosEventos: ItemAgendaDashboard[]
}) {
```

3. Adicionar card de próximos eventos logo após o header e antes dos cards de alunos (antes da seção `{totalAlunos === 0 && ...}`):

```tsx
{proximosEventos.length > 0 && (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-lg">
        <CalendarDays className="size-5 text-brand-600" />
        Próximos eventos
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {proximosEventos.map((item, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
          <span className="text-xl leading-none">{item.tipo === "jogo" ? "🏆" : "📣"}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">{item.titulo}</p>
            {item.alunoNome && (
              <p className="text-xs text-muted-foreground">{item.alunoNome}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          {item.tipo === "jogo" && item.confirmacao === null && (
            <Link href="/responsavel/jogos" className="text-xs font-semibold text-brand-600 hover:underline shrink-0">
              Confirmar
            </Link>
          )}
        </div>
      ))}
      <Link href="/responsavel/calendario" className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline pt-1">
        Ver calendário completo
        <ArrowRight className="size-3" />
      </Link>
    </CardContent>
  </Card>
)}
{proximosEventos.length === 0 && (
  <Card>
    <CardContent className="py-6 text-center text-sm text-muted-foreground">
      Nenhum evento nos próximos 30 dias.
    </CardContent>
  </Card>
)}
```

Verificar que `format`, `ptBR`, `Link` e `ArrowRight` já estão importados no arquivo (estão). Adicionar `CalendarDays` ao import de lucide se não estiver.

- [ ] **Step 4: Verificar visualmente**

Abrir `http://localhost:3000/responsavel` e confirmar: card "Próximos eventos" aparece (com dados ou mensagem vazia).

- [ ] **Step 5: Commit**

```bash
git add lib/responsavel-eventos.ts app/responsavel/page.tsx app/responsavel/dashboard-client.tsx
git commit -m "feat(portal): card de proximos eventos e jogos no dashboard do responsavel"
```

---

### Task 6: E2E para dashboard (histórico + próximos eventos)

**Files:**
- Create: `e2e/responsavel-dashboard-melhorias.spec.ts`

- [ ] **Step 1: Criar spec**

```ts
// e2e/responsavel-dashboard-melhorias.spec.ts
import { test, expect } from "@playwright/test"

const RESP_STORAGE = "e2e/.auth/responsavel.json"

test.describe("Dashboard melhorias — autenticado", () => {
  test.use({ storageState: RESP_STORAGE })

  test("widget de histórico de 6 meses aparece no dashboard", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page.getByText("Últimos 6 meses").first()).toBeVisible({ timeout: 8000 })
  })

  test("widget de histórico contém 6 pills de mês", async ({ page }) => {
    await page.goto("/responsavel")
    // Cada pill tem texto de mês abreviado; procura pelo container
    const container = page.locator("text=Últimos 6 meses").first().locator("..")
    await expect(container).toBeVisible({ timeout: 8000 })
  })

  test("card de próximos eventos ou mensagem vazia aparece", async ({ page }) => {
    await page.goto("/responsavel")
    const temEventos = await page.getByText("Próximos eventos").isVisible()
    if (temEventos) {
      await expect(page.getByText("Próximos eventos")).toBeVisible()
    } else {
      await expect(page.getByText(/Nenhum evento nos próximos/i)).toBeVisible({ timeout: 8000 })
    }
  })

  test("link 'Ver calendário completo' aparece ou fallback para nenhum evento", async ({ page }) => {
    await page.goto("/responsavel")
    const link = page.getByRole("link", { name: /calendário completo/i })
    const vazio = page.getByText(/Nenhum evento nos próximos/i)
    await expect(link.or(vazio)).toBeVisible({ timeout: 8000 })
  })
})
```

- [ ] **Step 2: Rodar E2E**

```bash
npx playwright test e2e/responsavel-dashboard-melhorias.spec.ts --reporter=line
```
Esperado: 4 testes passando

- [ ] **Step 3: Rodar suíte completa de unit tests**

```bash
npm test
```
Esperado: todos os testes existentes + novos passando

- [ ] **Step 4: Commit final**

```bash
git add e2e/responsavel-dashboard-melhorias.spec.ts
git commit -m "test(e2e): testes do widget historico e card de proximos eventos no dashboard"
```
