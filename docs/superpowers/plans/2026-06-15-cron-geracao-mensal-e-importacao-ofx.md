# Cron de Geração Mensal e Importação de Extrato OFX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatizar a geração de mensalidades no dia 1 de cada mês via cron, e permitir marcar mensalidades como pagas em lote via upload de extrato bancário OFX.

**Architecture:** Feature 1 extrai a lógica pura de `gerarMensalidadesMes` para `lib/pagamentos-jobs.ts` (sem auth nem revalidatePath), deixa o server action como thin wrapper e chama a função pura no cron existente. Feature 2 introduz um parser OFX, um matcher de nomes, server actions de preview/confirmar, e uma página de upload com três fases (upload → preview → resultado).

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma (SQLite), Vitest, shadcn/ui, date-fns, Tailwind CSS

---

## File Map

| Ação | Arquivo |
|------|---------|
| Criar | `lib/pagamentos-jobs.ts` |
| Criar | `lib/__tests__/pagamentos-jobs.test.ts` |
| Modificar | `app/actions/pagamentos.ts` (delegar para `runGerarMensalidadesMes`) |
| Modificar | `app/api/cron/lembretes/route.ts` (chamar no dia 1) |
| Criar | `lib/ofx-parser.ts` |
| Criar | `lib/__tests__/ofx-parser.test.ts` |
| Criar | `lib/ofx-matcher.ts` |
| Criar | `lib/__tests__/ofx-matcher.test.ts` |
| Criar | `app/actions/importar-extrato.ts` |
| Criar | `app/pagamentos/importar/page.tsx` |
| Criar | `components/pagamentos/importar-extrato-client.tsx` |
| Modificar | `app/pagamentos/pagamentos-client.tsx` (botão Importar OFX) |

---

## Task 1: `lib/pagamentos-jobs.ts` — lógica pura de geração mensal

**Files:**
- Create: `lib/pagamentos-jobs.ts`
- Create: `lib/__tests__/pagamentos-jobs.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/__tests__/pagamentos-jobs.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    aluno: { findMany: vi.fn() },
    pagamento: { findMany: vi.fn(), createMany: vi.fn() },
  },
}))

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(),
}))

import { runGerarMensalidadesMes } from "../pagamentos-jobs"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"

const mockDb = db as unknown as {
  aluno: { findMany: ReturnType<typeof vi.fn> }
  pagamento: { findMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> }
}
const mockGetConfig = getConfig as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockGetConfig.mockReturnValue({ diaVencimento: 10 })
  mockDb.pagamento.createMany.mockResolvedValue({ count: 0 })
})

describe("runGerarMensalidadesMes", () => {
  it("cria mensalidades para alunos ativos no mês", async () => {
    mockDb.aluno.findMany.mockResolvedValue([
      { id: 1, nome: "João" },
      { id: 2, nome: "Maria" },
    ])
    mockDb.pagamento.findMany.mockResolvedValue([])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [
        { alunoId: 1, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10) },
        { alunoId: 2, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10) },
      ],
    })
    expect(result).toEqual({ criados: 2, ignorados: 0 })
  })

  it("ignora alunos que já têm mensalidade no mês (idempotente)", async () => {
    mockDb.aluno.findMany.mockResolvedValue([
      { id: 1, nome: "João" },
      { id: 2, nome: "Maria" },
    ])
    mockDb.pagamento.findMany.mockResolvedValue([{ alunoId: 1 }])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [{ alunoId: 2, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10) }],
    })
    expect(result).toEqual({ criados: 1, ignorados: 1 })
  })

  it("usa diaVencimento da config", async () => {
    mockGetConfig.mockReturnValue({ diaVencimento: 15 })
    mockDb.aluno.findMany.mockResolvedValue([{ id: 1, nome: "João" }])
    mockDb.pagamento.findMany.mockResolvedValue([])

    await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [{ alunoId: 1, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 15) }],
    })
  })

  it("cai para dia 10 quando diaVencimento inválido", async () => {
    mockGetConfig.mockReturnValue({ diaVencimento: 30 })
    mockDb.aluno.findMany.mockResolvedValue([{ id: 1, nome: "João" }])
    mockDb.pagamento.findMany.mockResolvedValue([])

    await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [{ alunoId: 1, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10) }],
    })
  })

  it("não chama createMany quando todos os alunos já têm mensalidade", async () => {
    mockDb.aluno.findMany.mockResolvedValue([{ id: 1, nome: "João" }])
    mockDb.pagamento.findMany.mockResolvedValue([{ alunoId: 1 }])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).not.toHaveBeenCalled()
    expect(result).toEqual({ criados: 0, ignorados: 1 })
  })

  it("retorna { criados, ignorados } corretos", async () => {
    mockDb.aluno.findMany.mockResolvedValue([
      { id: 1, nome: "A" },
      { id: 2, nome: "B" },
      { id: 3, nome: "C" },
    ])
    mockDb.pagamento.findMany.mockResolvedValue([{ alunoId: 2 }, { alunoId: 3 }])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(result).toEqual({ criados: 1, ignorados: 2 })
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```
npx vitest run lib/__tests__/pagamentos-jobs.test.ts
```

Esperado: FAIL com "Cannot find module '../pagamentos-jobs'"

- [ ] **Step 3: Criar `lib/pagamentos-jobs.ts`**

```ts
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"

export async function runGerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number }> {
  const [ano, mesNum] = mes.split("-").map(Number)
  const rawDia = getConfig().diaVencimento
  const diaVencimento = Number.isInteger(rawDia) && rawDia >= 1 && rawDia <= 28 ? rawDia : 10

  const [alunos, existentes] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo" } }),
    db.pagamento.findMany({ where: { mesReferencia: mes }, select: { alunoId: true } }),
  ])

  const existentesSet = new Set(existentes.map((e) => e.alunoId))
  const novos = alunos.filter((a) => !existentesSet.has(a.id))

  if (novos.length > 0) {
    await db.pagamento.createMany({
      data: novos.map((a) => ({
        alunoId: a.id,
        mesReferencia: mes,
        dataVencimento: new Date(ano, mesNum - 1, diaVencimento),
      })),
    })
  }

  return { criados: novos.length, ignorados: existentesSet.size }
}
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```
npx vitest run lib/__tests__/pagamentos-jobs.test.ts
```

Esperado: 6 testes PASS

- [ ] **Step 5: Commit**

```bash
git add lib/pagamentos-jobs.ts lib/__tests__/pagamentos-jobs.test.ts
git commit -m "feat: extrair runGerarMensalidadesMes para lib/pagamentos-jobs"
```

---

## Task 2: Atualizar `app/actions/pagamentos.ts` para delegar

**Files:**
- Modify: `app/actions/pagamentos.ts` (linhas 102-139)

- [ ] **Step 1: Substituir o corpo de `gerarMensalidadesMes` por delegação**

No arquivo `app/actions/pagamentos.ts`, substituir a função `gerarMensalidadesMes` completa:

**Antes** (linhas 102-139):
```ts
export async function gerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number } | { error: string }> {
  await requireAuth()
  try {
    const [ano, mesNum] = mes.split("-").map(Number)
    const rawDia = getConfig().diaVencimento
    const diaVencimento = Number.isInteger(rawDia) && rawDia >= 1 && rawDia <= 28 ? rawDia : 10

    const [alunos, existentes] = await Promise.all([
      db.aluno.findMany({ where: { status: "Ativo" } }),
      db.pagamento.findMany({
        where: { mesReferencia: mes },
        select: { alunoId: true },
      }),
    ])

    const existentesSet = new Set(existentes.map((e) => e.alunoId))
    const novos = alunos.filter((a) => !existentesSet.has(a.id))

    if (novos.length > 0) {
      await db.pagamento.createMany({
        data: novos.map((a) => ({
          alunoId: a.id,
          mesReferencia: mes,
          dataVencimento: new Date(ano, mesNum - 1, diaVencimento),
        })),
      })
    }

    revalidatePath("/pagamentos")
    revalidatePath("/")

    return { criados: novos.length, ignorados: existentesSet.size }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar mensalidades" }
  }
}
```

**Depois:**
```ts
export async function gerarMensalidadesMes(
  mes: string
): Promise<{ criados: number; ignorados: number } | { error: string }> {
  await requireAuth()
  try {
    const result = await runGerarMensalidadesMes(mes)
    revalidatePath("/pagamentos")
    revalidatePath("/")
    return result
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao gerar mensalidades" }
  }
}
```

Adicionar o import no topo do arquivo (junto aos outros imports de `@/lib/`):
```ts
import { runGerarMensalidadesMes } from "@/lib/pagamentos-jobs"
```

Remover os imports que não são mais usados pela função: `getConfig` pode continuar sendo usado por outras funções no arquivo — verificar antes de remover.

- [ ] **Step 2: Verificar que o build e os testes existentes continuam passando**

```
npx vitest run
```

Esperado: todos os testes PASS

- [ ] **Step 3: Commit**

```bash
git add app/actions/pagamentos.ts
git commit -m "refactor: gerarMensalidadesMes delega para runGerarMensalidadesMes"
```

---

## Task 3: Adicionar geração mensal no cron (dia 1)

**Files:**
- Modify: `app/api/cron/lembretes/route.ts`

- [ ] **Step 1: Adicionar chamada no `GET` handler**

No arquivo `app/api/cron/lembretes/route.ts`, adicionar o import no topo:

```ts
import { runGerarMensalidadesMes } from "@/lib/pagamentos-jobs"
import { format } from "date-fns"
```

No corpo do `GET`, após a linha `const isDomingo = new Date().getDay() === 0`, adicionar:

```ts
const now = new Date()
const geracaoMensal =
  now.getDate() === 1
    ? await runGerarMensalidadesMes(format(now, "yyyy-MM"))
    : null
```

No `return NextResponse.json({...})`, adicionar `geracaoMensal` ao objeto de resposta:

```ts
return NextResponse.json({
  email: { inadimplentes: emailInadimplentes, vencendo: emailVencendo },
  whatsapp: { inadimplentes: waInadimplentes, vencendo: waVencendo, aniversarios: waAniversarios },
  cobrancas,
  housekeeping,
  geracaoMensal,
  executadoEm: new Date().toISOString(),
})
```

Nota: `date-fns` já é dependência do projeto. Verificar se `format` já é importado em outro lugar no arquivo antes de adicionar o import.

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```
npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/lembretes/route.ts
git commit -m "feat: cron gera mensalidades automaticamente no dia 1 do mês"
```

---

## Task 4: `lib/ofx-parser.ts` — parser de extrato OFX

**Files:**
- Create: `lib/ofx-parser.ts`
- Create: `lib/__tests__/ofx-parser.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Criar `lib/__tests__/ofx-parser.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { parseOFX } from "../ofx-parser"

const OFX_SAMPLE = `
<OFX>
<STMTTRN>
<TRNTYPE>CREDIT</TRNTYPE>
<DTPOSTED>20250601120000</DTPOSTED>
<TRNAMT>150.00</TRNAMT>
<FITID>111</FITID>
<MEMO>PIX RECEBIDO - JOAO SILVA</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT</TRNTYPE>
<DTPOSTED>20250605</DTPOSTED>
<TRNAMT>200.50</TRNAMT>
<FITID>222</FITID>
<MEMO>PIX RECEBIDO - MARIA SANTOS</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20250606120000</DTPOSTED>
<TRNAMT>-50.00</TRNAMT>
<FITID>333</FITID>
<MEMO>TARIFA BANCARIA</MEMO>
</STMTTRN>
</OFX>
`

describe("parseOFX", () => {
  it("parseia OFX SGML com 3 transações, retorna só créditos", () => {
    const result = parseOFX(OFX_SAMPLE)
    expect(result).toHaveLength(2)
    expect(result[0].fitid).toBe("111")
    expect(result[0].amount).toBe(150)
    expect(result[0].memo).toBe("PIX RECEBIDO - JOAO SILVA")
    expect(result[1].fitid).toBe("222")
    expect(result[1].amount).toBe(200.5)
  })

  it("lança erro em arquivo sem blocos STMTTRN", () => {
    expect(() => parseOFX("<OFX><BANKMSGSRSV1></BANKMSGSRSV1></OFX>")).toThrow(
      "Nenhuma transação encontrada no arquivo OFX"
    )
  })

  it("lança erro quando todos os blocos são débitos", () => {
    const onlyDebits = `
<OFX>
<STMTTRN>
<TRNTYPE>DEBIT</TRNTYPE>
<DTPOSTED>20250601120000</DTPOSTED>
<TRNAMT>-100.00</TRNAMT>
<FITID>999</FITID>
<MEMO>DEBITO</MEMO>
</STMTTRN>
</OFX>`
    expect(() => parseOFX(onlyDebits)).toThrow(
      "Nenhuma transação encontrada no arquivo OFX"
    )
  })

  it("parseia data no formato YYYYMMDDHHMMSS", () => {
    const result = parseOFX(OFX_SAMPLE)
    expect(result[0].date).toEqual(new Date(2025, 5, 1))
  })

  it("parseia data no formato YYYYMMDD (sem hora)", () => {
    const result = parseOFX(OFX_SAMPLE)
    expect(result[1].date).toEqual(new Date(2025, 4, 5))
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```
npx vitest run lib/__tests__/ofx-parser.test.ts
```

Esperado: FAIL com "Cannot find module '../ofx-parser'"

- [ ] **Step 3: Criar `lib/ofx-parser.ts`**

```ts
export type OFXTransaction = {
  fitid: string
  date: Date
  amount: number
  memo: string
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([^<]+)`, "i"))
  return match ? match[1].trim() : ""
}

function parseOFXDate(raw: string): Date {
  const year = parseInt(raw.slice(0, 4), 10)
  const month = parseInt(raw.slice(4, 6), 10) - 1
  const day = parseInt(raw.slice(6, 8), 10)
  return new Date(year, month, day)
}

export function parseOFX(content: string): OFXTransaction[] {
  const blockRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
  const blocks = [...content.matchAll(blockRegex)]

  const transactions: OFXTransaction[] = []

  for (const [, block] of blocks) {
    const amount = parseFloat(extractTag(block, "TRNAMT"))
    if (!amount || amount <= 0) continue

    transactions.push({
      fitid: extractTag(block, "FITID"),
      date: parseOFXDate(extractTag(block, "DTPOSTED")),
      amount,
      memo: extractTag(block, "MEMO"),
    })
  }

  if (transactions.length === 0) {
    throw new Error("Nenhuma transação encontrada no arquivo OFX")
  }

  return transactions
}
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```
npx vitest run lib/__tests__/ofx-parser.test.ts
```

Esperado: 5 testes PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ofx-parser.ts lib/__tests__/ofx-parser.test.ts
git commit -m "feat: parser de extrato OFX (SGML, filtro créditos)"
```

---

## Task 5: `lib/ofx-matcher.ts` — matching de transações com alunos

**Files:**
- Create: `lib/ofx-matcher.ts`
- Create: `lib/__tests__/ofx-matcher.test.ts`

- [ ] **Step 1: Escrever os testes que falham**

Criar `lib/__tests__/ofx-matcher.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { matchTransactions, type MatchResult } from "../ofx-matcher"
import type { OFXTransaction } from "../ofx-parser"

function makeTransaction(memo: string, amount = 150, fitid = "1"): OFXTransaction {
  return { fitid, date: new Date(2025, 5, 1), amount, memo }
}

function makePagamento(id: number, alunoId: number, dataPagamento: Date | null = null) {
  return { id, alunoId, mesReferencia: "2025-06", dataPagamento }
}

describe("matchTransactions", () => {
  it("transação com MEMO 'PIX - JOAO SILVA' casa com aluno 'João Silva' → confiança alta", () => {
    const alunos = [{ id: 1, nome: "João Silva" }]
    const pagamentos = [makePagamento(10, 1, null)]

    const [result] = matchTransactions(
      [makeTransaction("PIX - JOAO SILVA")],
      alunos,
      pagamentos
    )

    expect(result.alunoId).toBe(1)
    expect(result.alunoNome).toBe("João Silva")
    expect(result.pagamentoId).toBe(10)
    expect(result.confianca).toBe("alta")
  })

  it("transação com MEMO sem nome → confiança nenhuma", () => {
    const alunos = [{ id: 1, nome: "João Silva" }]
    const [result] = matchTransactions(
      [makeTransaction("TARIFA BANCARIA")],
      alunos,
      []
    )

    expect(result.alunoId).toBeNull()
    expect(result.pagamentoId).toBeNull()
    expect(result.confianca).toBe("nenhuma")
  })

  it("aluno com múltiplas mensalidades pendentes → confiança baixa", () => {
    const alunos = [{ id: 1, nome: "João Silva" }]
    const pagamentos = [
      makePagamento(10, 1, null),
      makePagamento(11, 1, null),
    ]

    const [result] = matchTransactions(
      [makeTransaction("PIX JOAO SILVA")],
      alunos,
      pagamentos
    )

    expect(result.alunoId).toBe(1)
    expect(result.confianca).toBe("baixa")
  })

  it("aluno sem mensalidades pendentes → confiança baixa (match mas sem pagamento)", () => {
    const alunos = [{ id: 1, nome: "João Silva" }]
    const pagamentos: typeof [] = []

    const [result] = matchTransactions(
      [makeTransaction("PIX JOAO SILVA")],
      alunos,
      pagamentos
    )

    expect(result.alunoId).toBe(1)
    expect(result.pagamentoId).toBeNull()
    expect(result.confianca).toBe("baixa")
  })

  it("normalização de acentos: 'JOAO' casa com 'João'", () => {
    const alunos = [{ id: 1, nome: "João Ferreira" }]
    const pagamentos = [makePagamento(10, 1, null)]

    const [result] = matchTransactions(
      [makeTransaction("CREDITO JOAO FERREIRA")],
      alunos,
      pagamentos
    )

    expect(result.alunoId).toBe(1)
    expect(result.confianca).toBe("alta")
  })

  it("seleciona a mensalidade mais antiga quando há exatamente 1 pendente", () => {
    const alunos = [{ id: 1, nome: "Maria Santos" }]
    const pagamentos = [makePagamento(20, 1, null)]

    const [result] = matchTransactions(
      [makeTransaction("PIX MARIA SANTOS")],
      alunos,
      pagamentos
    )

    expect(result.pagamentoId).toBe(20)
    expect(result.mesReferencia).toBe("2025-06")
  })

  it("não casa quando apenas primeira palavra do nome está presente (palavra curta)", () => {
    const alunos = [{ id: 1, nome: "Ana Lima" }]
    const pagamentos = [makePagamento(10, 1, null)]

    // "Ana" tem menos de 3 chars → não deve casar apenas por "Ana"
    const [result] = matchTransactions(
      [makeTransaction("PIX ANA OUTRO")],
      alunos,
      pagamentos
    )

    // "Ana" < 3 chars é ignorada; "Lima" está ausente → nenhuma
    expect(result.confianca).toBe("nenhuma")
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```
npx vitest run lib/__tests__/ofx-matcher.test.ts
```

Esperado: FAIL com "Cannot find module '../ofx-matcher'"

- [ ] **Step 3: Criar `lib/ofx-matcher.ts`**

```ts
import type { OFXTransaction } from "./ofx-parser"

type MatchConfianca = "alta" | "baixa" | "nenhuma"

export type MatchResult = {
  fitid: string
  date: Date
  amount: number
  memo: string
  alunoId: number | null
  alunoNome: string | null
  pagamentoId: number | null
  mesReferencia: string | null
  confianca: MatchConfianca
}

function normalizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
}

function palavrasSignificativas(nome: string): string[] {
  return normalizarNome(nome)
    .split(/\s+/)
    .filter((p) => p.length >= 3)
}

export function matchTransactions(
  transactions: OFXTransaction[],
  alunos: { id: number; nome: string }[],
  pagamentos: { id: number; alunoId: number; mesReferencia: string; dataPagamento: Date | null }[]
): MatchResult[] {
  const pendentes = pagamentos.filter((p) => p.dataPagamento === null)

  return transactions.map((tx) => {
    const memoNorm = normalizarNome(tx.memo)

    const alunoMatch = alunos.find((aluno) => {
      const palavras = palavrasSignificativas(aluno.nome)
      if (palavras.length === 0) return false
      const primeira = palavras[0]
      const ultima = palavras[palavras.length - 1]
      return memoNorm.includes(primeira) && memoNorm.includes(ultima)
    })

    if (!alunoMatch) {
      return {
        fitid: tx.fitid,
        date: tx.date,
        amount: tx.amount,
        memo: tx.memo,
        alunoId: null,
        alunoNome: null,
        pagamentoId: null,
        mesReferencia: null,
        confianca: "nenhuma",
      }
    }

    const pendentesAluno = pendentes.filter((p) => p.alunoId === alunoMatch.id)

    if (pendentesAluno.length === 1) {
      const pag = pendentesAluno[0]
      return {
        fitid: tx.fitid,
        date: tx.date,
        amount: tx.amount,
        memo: tx.memo,
        alunoId: alunoMatch.id,
        alunoNome: alunoMatch.nome,
        pagamentoId: pag.id,
        mesReferencia: pag.mesReferencia,
        confianca: "alta",
      }
    }

    // 0 ou múltiplas pendentes → confiança baixa; pega a mais antiga se houver
    const mais_antiga = pendentesAluno[0] ?? null
    return {
      fitid: tx.fitid,
      date: tx.date,
      amount: tx.amount,
      memo: tx.memo,
      alunoId: alunoMatch.id,
      alunoNome: alunoMatch.nome,
      pagamentoId: mais_antiga?.id ?? null,
      mesReferencia: mais_antiga?.mesReferencia ?? null,
      confianca: "baixa",
    }
  })
}
```

- [ ] **Step 4: Rodar os testes para confirmar que passam**

```
npx vitest run lib/__tests__/ofx-matcher.test.ts
```

Esperado: 7 testes PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ofx-matcher.ts lib/__tests__/ofx-matcher.test.ts
git commit -m "feat: matcher de transações OFX com alunos (confiança alta/baixa/nenhuma)"
```

---

## Task 6: `app/actions/importar-extrato.ts` — server actions

**Files:**
- Create: `app/actions/importar-extrato.ts`

- [ ] **Step 1: Criar o arquivo de server actions**

Criar `app/actions/importar-extrato.ts`:

```ts
"use server"

import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { parseOFX } from "@/lib/ofx-parser"
import { matchTransactions, type MatchResult } from "@/lib/ofx-matcher"
import { revalidatePath } from "next/cache"

export async function previewOFX(
  content: string
): Promise<MatchResult[] | { error: string }> {
  await requireAuth()

  let transactions
  try {
    transactions = parseOFX(content)
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao processar arquivo OFX" }
  }

  const [alunos, pagamentos] = await Promise.all([
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { id: true, nome: true },
    }),
    db.pagamento.findMany({
      where: { dataPagamento: null },
      select: { id: true, alunoId: true, mesReferencia: true, dataPagamento: true },
    }),
  ])

  return matchTransactions(transactions, alunos, pagamentos)
}

export async function confirmarImportacaoOFX(
  selecoes: { pagamentoId: number; valor: number; dataPagamento: string }[]
): Promise<{ atualizados: number } | { error: string }> {
  await requireAuth()

  try {
    await Promise.all(
      selecoes.map((s) =>
        db.pagamento.update({
          where: { id: s.pagamentoId },
          data: {
            dataPagamento: new Date(s.dataPagamento),
            valorRecebido: s.valor,
            formaPagamento: "Importação OFX",
          },
        })
      )
    )

    revalidatePath("/pagamentos")
    revalidatePath("/inadimplencia")
    revalidatePath("/caixa")

    return { atualizados: selecoes.length }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao confirmar importação" }
  }
}
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```
npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Step 3: Commit**

```bash
git add app/actions/importar-extrato.ts
git commit -m "feat: server actions previewOFX e confirmarImportacaoOFX"
```

---

## Task 7: Página e client component de importação

**Files:**
- Create: `app/pagamentos/importar/page.tsx`
- Create: `components/pagamentos/importar-extrato-client.tsx`

- [ ] **Step 1: Criar a página server component**

Criar `app/pagamentos/importar/page.tsx`:

```tsx
import { requireAuth } from "@/lib/auth"
import { ImportarExtratoClient } from "@/components/pagamentos/importar-extrato-client"

export const metadata = { title: "Importar Extrato OFX — Pagamentos" }

export default async function ImportarExtratoPage() {
  await requireAuth()
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <a
          href="/pagamentos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Pagamentos
        </a>
      </div>
      <h1 className="text-2xl font-bold">Importar Extrato OFX</h1>
      <ImportarExtratoClient />
    </div>
  )
}
```

- [ ] **Step 2: Criar o client component**

Criar `components/pagamentos/importar-extrato-client.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { previewOFX, confirmarImportacaoOFX } from "@/app/actions/importar-extrato"
import type { MatchResult } from "@/lib/ofx-matcher"

type Fase = "upload" | "preview"

export function ImportarExtratoClient() {
  const [fase, setFase] = useState<Fase>("upload")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [resultados, setResultados] = useState<MatchResult[]>([])
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [isPreviewing, startPreview] = useTransition()
  const [isConfirming, startConfirm] = useTransition()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setArquivo(e.target.files?.[0] ?? null)
  }

  function handleAnalisar() {
    if (!arquivo) return
    startPreview(async () => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        const result = await previewOFX(content)
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        const alta = result
          .filter((r) => r.confianca === "alta")
          .map((r) => r.fitid)
        setSelecionados(new Set(alta))
        setResultados(result)
        setFase("preview")
      }
      reader.readAsText(arquivo, "latin1")
    })
  }

  function toggleSelecionado(fitid: string) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(fitid)) next.delete(fitid)
      else next.add(fitid)
      return next
    })
  }

  function handleConfirmar() {
    const selecoes = resultados
      .filter((r) => selecionados.has(r.fitid) && r.pagamentoId !== null)
      .map((r) => ({
        pagamentoId: r.pagamentoId!,
        valor: r.amount,
        dataPagamento: r.date.toISOString().slice(0, 10),
      }))

    if (selecoes.length === 0) return

    startConfirm(async () => {
      const result = await confirmarImportacaoOFX(selecoes)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(`${result.atualizados} pagamento(s) registrado(s)`)
      setFase("upload")
      setArquivo(null)
      setResultados([])
      setSelecionados(new Set())
    })
  }

  const totalSelecionados = resultados.filter(
    (r) => selecionados.has(r.fitid) && r.pagamentoId !== null
  ).length

  if (fase === "upload") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Faça upload do arquivo OFX exportado do seu banco para marcar mensalidades como pagas em lote.
        </p>
        <div className="flex flex-col gap-3 max-w-sm">
          <label className="text-sm font-medium" htmlFor="ofx-file">
            Arquivo OFX
          </label>
          <input
            id="ofx-file"
            type="file"
            accept=".ofx,.ofc"
            onChange={handleFileChange}
            className="text-sm file:mr-4 file:rounded-md file:border-0 file:bg-brand-800 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-900"
          />
          <Button
            onClick={handleAnalisar}
            disabled={!arquivo || isPreviewing}
            className="w-fit"
          >
            {isPreviewing ? (
              <><Loader2 className="size-4 animate-spin" /> Analisando...</>
            ) : (
              <><Upload className="size-4" /> Analisar</>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {resultados.length} transação(ões) encontrada(s). Confirme as que deseja registrar.
      </p>
      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Descrição</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2">Aluno</th>
              <th className="px-3 py-2">Mês</th>
              <th className="px-3 py-2 text-center">Incluir</th>
            </tr>
          </thead>
          <tbody>
            {resultados.map((r) => (
              <tr
                key={r.fitid}
                className={
                  r.confianca === "nenhuma"
                    ? "opacity-50"
                    : r.confianca === "baixa"
                    ? "bg-yellow-50"
                    : ""
                }
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  {format(r.date, "dd/MM/yyyy", { locale: ptBR })}
                </td>
                <td className="px-3 py-2 max-w-xs truncate">{r.memo}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {r.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-3 py-2">
                  {r.alunoNome ?? <span className="text-muted-foreground">não identificado</span>}
                </td>
                <td className="px-3 py-2">
                  {r.mesReferencia ?? "—"}
                  {r.confianca === "baixa" && (
                    <span className="ml-1 text-xs text-yellow-700">verificar</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selecionados.has(r.fitid)}
                    disabled={r.confianca === "nenhuma" || r.pagamentoId === null}
                    onChange={() => toggleSelecionado(r.fitid)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setFase("upload")}>
          Voltar
        </Button>
        <Button
          onClick={handleConfirmar}
          disabled={totalSelecionados === 0 || isConfirming}
        >
          {isConfirming ? (
            <><Loader2 className="size-4 animate-spin" /> Salvando...</>
          ) : (
            `Confirmar ${totalSelecionados} pagamento(s)`
          )}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar que o TypeScript compila sem erros**

```
npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Step 4: Commit**

```bash
git add app/pagamentos/importar/page.tsx components/pagamentos/importar-extrato-client.tsx
git commit -m "feat: página e client component de importação OFX (3 fases: upload→preview→resultado)"
```

---

## Task 8: Botão "Importar OFX" em `pagamentos-client.tsx`

**Files:**
- Modify: `app/pagamentos/pagamentos-client.tsx`

- [ ] **Step 1: Adicionar o botão de link para `/pagamentos/importar`**

No arquivo `app/pagamentos/pagamentos-client.tsx`, adicionar o import de `Link` do Next.js (se não existir) e o ícone `FileUp`:

No bloco de imports existente (linha ~8):
```ts
import { CheckCircleIcon, PlusCircleIcon, Printer, Trash2Icon, MessageCircle, ListChecks, Loader2, Receipt, QrCode, Download, FileUp } from "lucide-react"
```

Adicionar import de Link:
```ts
import Link from "next/link"
```

Na `<div className="flex flex-wrap items-center gap-3">` (linha ~406), após o botão "Exportar CSV":

```tsx
<Button variant="outline" asChild>
  <Link href="/pagamentos/importar">
    <FileUp className="size-4" />
    Importar OFX
  </Link>
</Button>
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```
npx tsc --noEmit
```

Esperado: sem erros

- [ ] **Step 3: Rodar todos os testes**

```
npx vitest run
```

Esperado: todos os testes existentes + os novos PASS

- [ ] **Step 4: Commit**

```bash
git add app/pagamentos/pagamentos-client.tsx
git commit -m "feat: botão Importar OFX na página de pagamentos"
```

---

## Self-Review

### Cobertura da spec

**Feature 1 (Cron Geração Mensal):**
- ✅ `runGerarMensalidadesMes` em `lib/pagamentos-jobs.ts` com lógica pura (sem auth, sem revalidatePath)
- ✅ `gerarMensalidadesMes` server action delega para a função pura (Task 2)
- ✅ Cron chama no dia 1, inclui `geracaoMensal` na resposta (Task 3)
- ✅ Testes: cria mensalidades, ignora existentes, usa diaVencimento da config, retorna criados/ignorados (Task 1)

**Feature 2 (Importação OFX):**
- ✅ `lib/ofx-parser.ts` parseia SGML, extrai blocos STMTTRN, filtra créditos, lança erro se vazio (Task 4)
- ✅ `lib/ofx-matcher.ts` normaliza nomes, casa primeiro+último word ≥ 3 chars, retorna confiança alta/baixa/nenhuma (Task 5)
- ✅ `previewOFX` e `confirmarImportacaoOFX` em server actions (Task 6)
- ✅ Página server component com `requireAuth()`, link ← Pagamentos (Task 7)
- ✅ Client component 3 fases: upload (FileReader latin1), preview (tabela com checkboxes), resultado (toast + reset) (Task 7)
- ✅ Botão "Importar OFX" em `pagamentos-client.tsx` (Task 8)
- ✅ `formaPagamento: "Importação OFX"` ao confirmar (Task 6)

### Placeholder scan
Nenhum "TBD", "TODO" ou passo sem código encontrado.

### Consistência de tipos
- `OFXTransaction` definido em `lib/ofx-parser.ts`, importado em `lib/ofx-matcher.ts` e `app/actions/importar-extrato.ts` ✅
- `MatchResult` definido e exportado de `lib/ofx-matcher.ts`, importado no client component ✅
- `selecoes: { pagamentoId: number; valor: number; dataPagamento: string }[]` consistente entre client e server action ✅
