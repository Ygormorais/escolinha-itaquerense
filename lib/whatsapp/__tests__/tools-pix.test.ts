import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    responsavel: { findUnique: vi.fn() },
    pagamento: { findFirst: vi.fn(), update: vi.fn() },
  },
}))

vi.mock("@/lib/mercadopago", () => ({
  getMpPayment: vi.fn(() => ({ create: vi.fn() })),
  mpStatusToLocal: vi.fn((s: string) => s === "approved" ? "pago" : "pendente"),
}))

import { executarObterPixMensalidade } from "@/lib/whatsapp/tools"
import { db } from "@/lib/db"

const m = db as unknown as {
  responsavel: { findUnique: ReturnType<typeof vi.fn> }
  pagamento: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}

const mesAtual = new Date().toISOString().slice(0, 7)

beforeEach(() => {
  vi.clearAllMocks()
  m.pagamento.update.mockResolvedValue({})
})

describe("executarObterPixMensalidade", () => {
  it("retorna pix existente quando pendente", async () => {
    m.responsavel.findUnique.mockResolvedValue({ email: "r@test.com", alunos: [{ id: 1, nome: "João", mensalidade: 200 }] })
    m.pagamento.findFirst.mockResolvedValue({
      id: 10, mesReferencia: mesAtual, dataPagamento: null,
      pixCopiaECola: "00020126...", statusCobranca: "pendente",
      aluno: { mensalidade: 200 },
    })
    const res = await executarObterPixMensalidade({ responsavelId: 1 })
    expect(res.alunos[0].status).toBe("pendente")
    expect(res.alunos[0].pixCopiaECola).toBe("00020126...")
  })

  it("retorna status pago quando dataPagamento existe", async () => {
    m.responsavel.findUnique.mockResolvedValue({ email: "r@test.com", alunos: [{ id: 1, nome: "João", mensalidade: 200 }] })
    m.pagamento.findFirst.mockResolvedValue({
      id: 10, mesReferencia: mesAtual, dataPagamento: new Date(),
      pixCopiaECola: null, statusCobranca: "pago",
      aluno: { mensalidade: 200 },
    })
    const res = await executarObterPixMensalidade({ responsavelId: 1 })
    expect(res.alunos[0].status).toBe("pago")
  })

  it("retorna sem_cobranca quando nao ha pagamento no mes", async () => {
    m.responsavel.findUnique.mockResolvedValue({ email: "r@test.com", alunos: [{ id: 1, nome: "João", mensalidade: 200 }] })
    m.pagamento.findFirst.mockResolvedValue(null)
    const res = await executarObterPixMensalidade({ responsavelId: 1 })
    expect(res.alunos[0].status).toBe("sem_cobranca")
  })
})
