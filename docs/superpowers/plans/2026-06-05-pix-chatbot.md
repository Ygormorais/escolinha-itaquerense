# PIX Direto no Chatbot WhatsApp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Quando responsável pergunta sobre mensalidade no WhatsApp, o chatbot responde com o PIX copia-e-cola do mês atual (reutiliza cobrança existente ou gera nova via Mercado Pago).

**Architecture:** Nova tool `obterPixMensalidade` adicionada a `lib/whatsapp/tools.ts`. A tool busca o pagamento do mês atual, usa PIX existente se pendente, ou emite novo via `mpPayment.create`. O system prompt do chatbot é estendido com intenções de pagamento.

**Tech Stack:** Next.js 16, Prisma SQLite, Mercado Pago SDK, `@anthropic-ai/sdk`, Vitest.

**Working directory:** `escolinha-itaquerense/`

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `lib/whatsapp/tools.ts` | Modify — nova tool definition + handler `obterPixMensalidade` |
| `lib/whatsapp/ai-router.ts` | Modify — estende system prompt com intenções de pagamento |
| `lib/whatsapp/__tests__/tools-pix.test.ts` | Create — testes da nova tool |

---

## Task 1: Tool `obterPixMensalidade` (TDD)

**Files:**
- Modify: `lib/whatsapp/tools.ts`
- Create: `lib/whatsapp/__tests__/tools-pix.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Crie `lib/whatsapp/__tests__/tools-pix.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    responsavel: { findUnique: vi.fn() },
    pagamento: { findFirst: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/lib/mercadopago", () => ({
  getMpPayment: () => ({ create: vi.fn() }),
  mpStatusToLocal: vi.fn((s: string) => s === "approved" ? "pago" : "pendente"),
}))

import { executarObterPixMensalidade } from "@/lib/whatsapp/tools"
import { db } from "@/lib/db"

const m = db as unknown as {
  responsavel: { findUnique: ReturnType<typeof vi.fn> }
  pagamento: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}

const mesAtual = new Date().toISOString().slice(0, 7) // "YYYY-MM"

beforeEach(() => {
  vi.clearAllMocks()
  m.pagamento.update.mockResolvedValue({})
})

describe("executarObterPixMensalidade", () => {
  it("retorna copia-e-cola existente quando PIX ja emitido", async () => {
    m.responsavel.findUnique.mockResolvedValue({
      alunos: [{ id: 1, nome: "João", mensalidade: 200 }],
    })
    m.pagamento.findFirst.mockResolvedValue({
      id: 10,
      mesReferencia: mesAtual,
      aluno: { mensalidade: 200 },
      dataPagamento: null,
      pixCopiaECola: "00020126...",
      statusCobranca: "pendente",
    })

    const res = await executarObterPixMensalidade({ responsavelId: 1 })

    expect(res.alunos[0].status).toBe("pendente")
    expect(res.alunos[0].pixCopiaECola).toBe("00020126...")
    expect(res.alunos[0].nome).toBe("João")
  })

  it("retorna status 'pago' quando dataPagamento existe", async () => {
    m.responsavel.findUnique.mockResolvedValue({
      alunos: [{ id: 1, nome: "João", mensalidade: 200 }],
    })
    m.pagamento.findFirst.mockResolvedValue({
      id: 10,
      mesReferencia: mesAtual,
      aluno: { mensalidade: 200 },
      dataPagamento: new Date(),
      pixCopiaECola: null,
      statusCobranca: "pago",
    })

    const res = await executarObterPixMensalidade({ responsavelId: 1 })
    expect(res.alunos[0].status).toBe("pago")
    expect(res.alunos[0].pixCopiaECola).toBeNull()
  })

  it("retorna sem_cobranca quando nao ha pagamento no mes", async () => {
    m.responsavel.findUnique.mockResolvedValue({
      alunos: [{ id: 1, nome: "João", mensalidade: 200 }],
    })
    m.pagamento.findFirst.mockResolvedValue(null)

    const res = await executarObterPixMensalidade({ responsavelId: 1 })
    expect(res.alunos[0].status).toBe("sem_cobranca")
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

Run: `npx vitest run lib/whatsapp/__tests__/tools-pix.test.ts`
Expected: FAIL — `executarObterPixMensalidade` não existe.

- [ ] **Step 3: Implementar em `lib/whatsapp/tools.ts`**

Adicione no final de `TOOL_DEFINITIONS`:

```ts
  {
    name: "obter_pix_mensalidade",
    description: "Retorna o PIX copia-e-cola da mensalidade do mês atual para os alunos do responsável. Use quando o responsável perguntar sobre pagamento, pix, boleto, mensalidade ou quanto deve.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
```

Adicione a função exportada (antes do `executeTool` existente):

```ts
export async function executarObterPixMensalidade(
  input: { responsavelId: number }
): Promise<{ alunos: Array<{ nome: string; mes: string; valor: number; pixCopiaECola: string | null; status: "pago" | "pendente" | "sem_cobranca" }> }> {
  const mesAtual = new Date().toISOString().slice(0, 7)

  const resp = await db.responsavel.findUnique({
    where: { id: input.responsavelId },
    include: { alunos: { select: { id: true, nome: true, mensalidade: true } } },
  })

  if (!resp) return { alunos: [] }

  const resultados = await Promise.all(
    resp.alunos.map(async (aluno) => {
      const pag = await db.pagamento.findFirst({
        where: { alunoId: aluno.id, mesReferencia: mesAtual },
        include: { aluno: { select: { mensalidade: true } } },
      })

      if (!pag) return { nome: aluno.nome, mes: mesAtual, valor: aluno.mensalidade, pixCopiaECola: null, status: "sem_cobranca" as const }
      if (pag.dataPagamento) return { nome: aluno.nome, mes: mesAtual, valor: pag.aluno.mensalidade, pixCopiaECola: null, status: "pago" as const }

      // Já tem PIX pendente
      if (pag.pixCopiaECola && pag.statusCobranca === "pendente") {
        return { nome: aluno.nome, mes: mesAtual, valor: pag.aluno.mensalidade, pixCopiaECola: pag.pixCopiaECola, status: "pendente" as const }
      }

      // Gera novo PIX via MP
      try {
        const { getMpPayment } = await import("@/lib/mercadopago")
        const mp = getMpPayment()
        const response = await mp.create({
          body: {
            transaction_amount: pag.aluno.mensalidade,
            description: `Mensalidade ${mesAtual} — ${aluno.nome}`,
            payment_method_id: "pix",
            payer: { email: resp.email ?? "responsavel@escolinha.com" },
            date_of_expiration: new Date(Date.now() + 3 * 86_400_000).toISOString(),
          },
        })
        const qrCode = response.point_of_interaction?.transaction_data?.qr_code ?? null
        if (qrCode) {
          await db.pagamento.update({
            where: { id: pag.id },
            data: { canalPrevisto: "PIX", statusCobranca: "pendente", externalId: String(response.id), pixCopiaECola: qrCode },
          })
        }
        return { nome: aluno.nome, mes: mesAtual, valor: pag.aluno.mensalidade, pixCopiaECola: qrCode, status: "pendente" as const }
      } catch {
        return { nome: aluno.nome, mes: mesAtual, valor: pag.aluno.mensalidade, pixCopiaECola: null, status: "sem_cobranca" as const }
      }
    })
  )

  return { alunos: resultados }
}
```

Adicione ao switch do `executeTool`:

```ts
    case "obter_pix_mensalidade": {
      if (!context?.responsavelId) return JSON.stringify({ erro: "Sessão não identificada" })
      const res = await executarObterPixMensalidade({ responsavelId: context.responsavelId })
      return JSON.stringify(res)
    }
```

- [ ] **Step 4: Rodar — esperar passar**

Run: `npx vitest run lib/whatsapp/__tests__/tools-pix.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/whatsapp/tools.ts lib/whatsapp/__tests__/tools-pix.test.ts
git commit -m "feat(chatbot): tool obterPixMensalidade emite ou reutiliza PIX do mes atual"
```

---

## Task 2: Estender system prompt com intenções de pagamento

**Files:**
- Modify: `lib/whatsapp/ai-router.ts`

- [ ] **Step 1: Localizar e atualizar o system prompt**

Em `lib/whatsapp/ai-router.ts`, localize a string do system prompt (começa com `"Você é um assistente..."` ou similar). Adicione ao final do prompt, antes do fechamento das aspas:

```
Quando o responsável perguntar sobre pagamento, pix, boleto, mensalidade, quanto deve, cobrança ou vencimento, SEMPRE use a tool obter_pix_mensalidade para buscar o PIX do mês atual antes de responder.
```

- [ ] **Step 2: Verificar que `context.responsavelId` é passado ao `executeTool`**

Em `ai-router.ts`, confirme que o `executeTool` recebe o contexto com `responsavelId`. Se a assinatura atual for `executeTool(name, input)`, mude para `executeTool(name, input, { responsavelId: session.responsavelId })` nas duas chamadas.

- [ ] **Step 3: Verificar `executeTool` recebe contexto**

Em `lib/whatsapp/tools.ts`, na função `executeTool`, adicione o parâmetro:

```ts
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  context?: { responsavelId?: number }
): Promise<string> {
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -i "tools\|pix\|chatbot" | head -5`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add lib/whatsapp/ai-router.ts lib/whatsapp/tools.ts
git commit -m "feat(chatbot): system prompt detecta intencao de pagamento e chama obterPixMensalidade"
```

---

## Task 3: Verificação final

- [ ] **Step 1: Rodar testes**

Run: `npx vitest run lib/whatsapp/__tests__/tools-pix.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
Expected: `0`

- [ ] **Step 3: Push**

```bash
git push origin develop
```
