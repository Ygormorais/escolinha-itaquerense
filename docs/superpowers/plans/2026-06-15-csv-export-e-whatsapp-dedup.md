# CSV Export e WhatsApp Dedup — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar exportação CSV nas páginas de pagamentos e frequência (as demais já têm), e corrigir o job de lembretes WhatsApp para agrupar mensalidades por aluno e respeitar intervalo configurável entre envios.

**Architecture:** 3 de 5 páginas (alunos, inadimplência, custos) já usam client-side CSV via `sanitizeCSVCell` + `Blob` + `URL.createObjectURL`. Pagamentos e frequência seguem o mesmo padrão. O WhatsApp job já existe mas manda uma mensagem por mensalidade em atraso sem dedup — a reescrita agrupa por aluno e registra o envio em `WhatsAppMensagem` com `origem: "lembrete-inadimplencia"` (mesmo padrão do aniversário). O intervalo é configurável em `lib/config.ts` + UI.

**Tech Stack:** Next.js 16, React, Prisma/SQLite, Vitest, `sanitizeCSVCell` (já em `lib/utils.ts`), `lucide-react` (Download), `setWhatsAppProvider` (para injeção de mock nos testes).

---

### Task 1: CSV export — Pagamentos

**Files:**
- Modify: `app/pagamentos/pagamentos-client.tsx`

- [ ] **Step 1: Adicionar imports**

No topo do arquivo, adicionar `Download` ao import do lucide-react e `sanitizeCSVCell` ao import de utils:

```ts
// linha com PlusCircleIcon, CheckCircleIcon etc — adicionar Download:
import { CheckCircleIcon, PlusCircleIcon, Printer, Trash2Icon, MessageCircle, ListChecks, Loader2, Receipt, QrCode, Download } from "lucide-react"

// linha com formatMoney, plural — adicionar sanitizeCSVCell:
import { formatMoney, plural, sanitizeCSVCell } from "@/lib/utils"
```

- [ ] **Step 2: Adicionar função `exportarCSV` antes do `return`**

Dentro do `PagamentosClient`, logo após a linha `const pendentesFiltered = filtered.filter(...)`, adicionar:

```ts
function exportarCSV() {
  const linhas = [
    ["Nome", "Turma", "Mês Ref.", "Mensalidade (R$)", "Vencimento", "Data Pagamento", "Forma", "Status"],
    ...filtered.map((p) => [
      p.aluno.nome,
      p.aluno.turma,
      p.mesReferencia,
      p.aluno.mensalidade.toFixed(2),
      new Date(p.dataVencimento).toLocaleDateString("pt-BR"),
      p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString("pt-BR") : "",
      p.formaPagamento ?? "",
      getPagamentoStatus(p),
    ]),
  ]
  const csv = linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `pagamentos-${mes}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 3: Adicionar botão na barra de filtros**

Localizar o `<div className="flex flex-wrap items-center gap-3">` que contém os selects de statusFilter e turmaFilter (linha ~382). Adicionar o botão ao final do div, após o select de turma:

```tsx
<Button variant="outline" onClick={exportarCSV} disabled={filtered.length === 0}>
  <Download className="size-4" />
  Exportar CSV
</Button>
```

- [ ] **Step 4: Verificar manualmente**

Iniciar o dev server (`npm run dev`), navegar para `/pagamentos`, clicar em "Exportar CSV". Confirmar que o arquivo baixado abre no Excel/Sheets com as colunas corretas e acentos.

- [ ] **Step 5: Commit**

```bash
git add app/pagamentos/pagamentos-client.tsx
git commit -m "feat(pagamentos): exportar CSV com filtros aplicados"
```

---

### Task 2: CSV export — Frequência

**Files:**
- Modify: `app/frequencia/frequencia-client.tsx`

- [ ] **Step 1: Adicionar imports**

```ts
// adicionar Download ao import do lucide-react:
import { SaveIcon, Printer, QrCode, ClipboardList, Loader2, Download } from "lucide-react"

// adicionar sanitizeCSVCell ao import de utils:
import { sanitizeCSVCell } from "@/lib/utils"
```

- [ ] **Step 2: Adicionar função `exportarCSV` antes do `return`**

Logo antes do `return (`, dentro do `FrequenciaClient`:

```ts
function exportarCSV() {
  const linhas = [
    ["Aluno", "Turma", "Data", "Presença"],
    ...alunos.map((a) => [
      a.nome,
      turma,
      new Date(data + "T12:00:00").toLocaleDateString("pt-BR"),
      presencas[a.id] ?? "Ausente",
    ]),
  ]
  const csv = linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `frequencia-${turma.replace(/\s+/g, "-")}-${data}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 3: Adicionar botão (só quando `loaded`)**

Localizar o bloco `{loaded && (`. Dentro dele, encontrar o `<div className="flex items-center justify-between">` que fica logo abaixo. Adicionar o botão de export ao lado dos botões de imprimir/salvar já existentes:

```tsx
<Button variant="outline" size="sm" onClick={exportarCSV} disabled={alunos.length === 0}>
  <Download className="size-4" />
  Exportar CSV
</Button>
```

- [ ] **Step 4: Verificar manualmente**

Navegar para `/frequencia`, selecionar turma e data, clicar em Carregar, depois em Exportar CSV. Confirmar que o arquivo tem os dados corretos.

- [ ] **Step 5: Commit**

```bash
git add app/frequencia/frequencia-client.tsx
git commit -m "feat(frequencia): exportar CSV da lista de presença carregada"
```

---

### Task 3: Config — intervaloDiasLembreteInadimplencia

**Files:**
- Modify: `lib/config.ts`
- Modify: `app/configuracoes/config-form.tsx`
- Modify: `lib/__tests__/config.test.ts`

- [ ] **Step 1: Adicionar campo ao tipo e default em `lib/config.ts`**

```ts
// No tipo ClubConfig — adicionar após diaVencimento:
  intervaloDiasLembreteInadimplencia: number

// No objeto DEFAULT — adicionar após diaVencimento: 10,:
  intervaloDiasLembreteInadimplencia: 7,
```

O arquivo final fica:

```ts
import fs from "fs"
import path from "path"

export type ClubConfig = {
  nome: string
  endereco: string
  telefone: string
  cidade: string
  metaMensal: number
  capacidadeTurma: number
  chavePix: string
  whatsapp: string
  googleCalendarId: string
  diaVencimento: number
  intervaloDiasLembreteInadimplencia: number
}

const CONFIG_PATH = path.join(process.cwd(), "club.config.json")

const DEFAULT: ClubConfig = {
  nome: "E.C. Itaquerense",
  endereco: "Rua das Palmeiras, 123 — Vila Futebol",
  telefone: "",
  cidade: "São Paulo/SP",
  metaMensal: 0,
  capacidadeTurma: 20,
  chavePix: "ygorcamisa1@gmail.com",
  whatsapp: "5511999999999",
  googleCalendarId: "",
  diaVencimento: 10,
  intervaloDiasLembreteInadimplencia: 7,
}

export function getConfig(): ClubConfig {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8")
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return DEFAULT
  }
}

export function saveConfig(config: ClubConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
}
```

- [ ] **Step 2: Atualizar o `DEFAULT` em `lib/__tests__/config.test.ts`**

O teste tem um objeto `DEFAULT` local que precisa bater com o real. Adicionar o novo campo:

```ts
const DEFAULT: ClubConfig = {
  nome: "E.C. Itaquerense",
  endereco: "Rua das Palmeiras, 123 — Vila Futebol",
  telefone: "",
  cidade: "São Paulo/SP",
  metaMensal: 0,
  capacidadeTurma: 20,
  chavePix: "ygorcamisa1@gmail.com",
  whatsapp: "5511999999999",
  googleCalendarId: "",
  diaVencimento: 10,
  intervaloDiasLembreteInadimplencia: 7,
}
```

- [ ] **Step 3: Rodar os testes de config para garantir que passam**

```bash
npx vitest run lib/__tests__/config.test.ts
```

Esperado: 4 testes passando.

- [ ] **Step 4: Adicionar campo ao formulário em `app/configuracoes/config-form.tsx`**

Localizar o campo `diaVencimento` no formulário (dentro do Card "Dados do Clube"). Adicionar o novo campo logo após ele, antes do `<Button type="submit">`:

```tsx
<div className="space-y-1">
  <Label htmlFor="cfg-intervalo-lembrete">Intervalo entre lembretes de inadimplência (dias)</Label>
  <Input
    id="cfg-intervalo-lembrete"
    name="intervaloDiasLembreteInadimplencia"
    type="number"
    min={1}
    max={90}
    value={form.intervaloDiasLembreteInadimplencia}
    onChange={handleChange}
  />
</div>
```

- [ ] **Step 5: Verificar no browser**

Navegar para `/configuracoes`, confirmar que o campo aparece com valor 7, alterar para 14, salvar e recarregar a página para confirmar persistência.

- [ ] **Step 6: Commit**

```bash
git add lib/config.ts lib/__tests__/config.test.ts app/configuracoes/config-form.tsx
git commit -m "feat(config): intervalo configuravel para lembretes de inadimplencia"
```

---

### Task 4: WhatsApp dedup — TDD

**Files:**
- Create: `lib/__tests__/whatsapp-jobs.test.ts`
- Modify: `lib/whatsapp-jobs.ts`

- [ ] **Step 1: Escrever os testes (todos devem falhar inicialmente)**

Criar `lib/__tests__/whatsapp-jobs.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    pagamento: { findMany: vi.fn() },
    whatsAppMensagem: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(),
}))

vi.mock("@/lib/whatsapp/provider", () => ({
  getWhatsAppProvider: vi.fn(),
}))

import { runEnviarLembretesWhatsAppInadimplencia } from "../whatsapp-jobs"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"

const mockDb = db as unknown as {
  pagamento: { findMany: ReturnType<typeof vi.fn> }
  whatsAppMensagem: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
}

const mockGetConfig = getConfig as ReturnType<typeof vi.fn>
const mockGetProvider = getWhatsAppProvider as ReturnType<typeof vi.fn>

function makePagamento(overrides: { alunoId?: number; mesReferencia?: string; telefone?: string } = {}) {
  const alunoId = overrides.alunoId ?? 1
  return {
    id: Math.random(),
    mesReferencia: overrides.mesReferencia ?? "Junho/2025",
    dataVencimento: new Date("2025-06-10"),
    aluno: {
      id: alunoId,
      nome: "João Silva",
      responsavel: "Maria Silva",
      telefone: overrides.telefone ?? "11999999999",
      mensalidade: 150,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetConfig.mockReturnValue({ intervaloDiasLembreteInadimplencia: 7, chavePix: "" })
  mockGetProvider.mockReturnValue({ sendText: vi.fn().mockResolvedValue({}) })
  mockDb.whatsAppMensagem.findFirst.mockResolvedValue(null) // sem histórico por padrão
  mockDb.whatsAppMensagem.create.mockResolvedValue({})
})

describe("runEnviarLembretesWhatsAppInadimplencia", () => {
  it("envia 1 mensagem para aluno com 1 mês em atraso", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento()])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).toHaveBeenCalledTimes(1)
    expect(result.enviados).toBe(1)
    expect(result.pulados).toBe(0)
  })

  it("envia 1 mensagem consolidada para aluno com 3 meses em atraso", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([
      makePagamento({ alunoId: 1, mesReferencia: "Abril/2025" }),
      makePagamento({ alunoId: 1, mesReferencia: "Maio/2025" }),
      makePagamento({ alunoId: 1, mesReferencia: "Junho/2025" }),
    ])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).toHaveBeenCalledTimes(1)
    const msgEnviada = sendText.mock.calls[0][0].mensagem as string
    expect(msgEnviada).toContain("Abril/2025")
    expect(msgEnviada).toContain("Maio/2025")
    expect(msgEnviada).toContain("Junho/2025")
    expect(result.enviados).toBe(1)
  })

  it("pula aluno notificado há 3 dias quando intervalo é 7", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento()])
    const tresAtraso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    mockDb.whatsAppMensagem.findFirst.mockResolvedValue({ createdAt: tresAtraso })
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).not.toHaveBeenCalled()
    expect(result.pulados).toBe(1)
    expect(result.enviados).toBe(0)
  })

  it("envia para aluno notificado há 8 dias quando intervalo é 7", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento()])
    const oitoAtraso = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    mockDb.whatsAppMensagem.findFirst.mockResolvedValue({ createdAt: oitoAtraso })
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).toHaveBeenCalledTimes(1)
    expect(result.enviados).toBe(1)
  })

  it("conta semTelefone para aluno sem telefone e não envia", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento({ telefone: "" })])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).not.toHaveBeenCalled()
    expect(result.semTelefone).toBe(1)
    expect(result.enviados).toBe(0)
  })

  it("grava registro em WhatsAppMensagem após envio bem-sucedido", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento()])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    await runEnviarLembretesWhatsAppInadimplencia()

    expect(mockDb.whatsAppMensagem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          alunoId: 1,
          origem: "lembrete-inadimplencia",
        }),
      })
    )
  })
})
```

- [ ] **Step 2: Rodar os testes e confirmar que TODOS falham**

```bash
npx vitest run lib/__tests__/whatsapp-jobs.test.ts
```

Esperado: 6 testes falhando (função atual sem dedup nem agrupamento).

- [ ] **Step 3: Reescrever `runEnviarLembretesWhatsAppInadimplencia` em `lib/whatsapp-jobs.ts`**

Substituir a função existente (linhas 7–48) pela versão com dedup:

```ts
export async function runEnviarLembretesWhatsAppInadimplencia() {
  const config = getConfig()
  const intervaloMs = (config.intervaloDiasLembreteInadimplencia ?? 7) * 24 * 60 * 60 * 1000
  let enviados = 0
  let pulados = 0
  let semTelefone = 0
  let erros = 0

  const atrasadas = await db.pagamento.findMany({
    where: {
      dataPagamento: null,
      dataVencimento: { lt: new Date() },
    },
    include: {
      aluno: { select: { id: true, nome: true, telefone: true, responsavel: true, mensalidade: true } },
    },
  })

  // Agrupa por alunoId para consolidar múltiplos meses em 1 mensagem
  const porAluno = new Map<number, typeof atrasadas>()
  for (const p of atrasadas) {
    const lista = porAluno.get(p.aluno.id) ?? []
    lista.push(p)
    porAluno.set(p.aluno.id, lista)
  }

  for (const [alunoId, pagamentos] of porAluno) {
    const aluno = pagamentos[0].aluno
    const tel = aluno.telefone?.replace(/\D/g, "")
    if (!tel || tel.length < 8) { semTelefone++; continue }

    // Dedup: verifica último envio para este aluno
    const ultimoEnvio = await db.whatsAppMensagem.findFirst({
      where: { alunoId, origem: "lembrete-inadimplencia" },
      orderBy: { createdAt: "desc" },
    })
    if (ultimoEnvio && Date.now() - new Date(ultimoEnvio.createdAt).getTime() < intervaloMs) {
      pulados++
      continue
    }

    const nome = aluno.responsavel?.split(" ")[0] ?? "responsável"
    const linhasMeses = pagamentos.map((p) => `• ${p.mesReferencia} — ${formatMoney(aluno.mensalidade)}`)
    const total = formatMoney(pagamentos.length * aluno.mensalidade)

    const msg = [
      `Olá ${nome}!`,
      ``,
      `Lembrete: mensalidades de *${aluno.nome}* em atraso:`,
      ``,
      ...linhasMeses,
      ``,
      `Total: *${total}*`,
      config.chavePix ? `PIX: ${config.chavePix}` : ``,
      ``,
      `Qualquer dúvida, entre em contato.`,
    ].filter(Boolean).join("\n")

    try {
      await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
      await db.whatsAppMensagem.create({
        data: {
          alunoId,
          telefone: tel,
          mensagem: msg,
          origem: "lembrete-inadimplencia",
          direcao: "outgoing",
          status: "sent",
          instancia: "escolinha",
        },
      })
      enviados++
    } catch {
      erros++
    }
  }

  return { enviados, pulados, erros, semTelefone }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que TODOS passam**

```bash
npx vitest run lib/__tests__/whatsapp-jobs.test.ts
```

Esperado: 6 testes passando.

- [ ] **Step 5: Rodar a suite completa de unit tests**

```bash
npx vitest run
```

Esperado: todos os testes passando (suite atual ~402 + 6 novos).

- [ ] **Step 6: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: 0 erros.

- [ ] **Step 7: Commit**

```bash
git add lib/__tests__/whatsapp-jobs.test.ts lib/whatsapp-jobs.ts
git commit -m "fix(whatsapp): dedup por aluno e intervalo configuravel em lembretes de inadimplencia"
```
