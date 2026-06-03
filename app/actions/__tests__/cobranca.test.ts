import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    pagamento: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))

vi.mock("@/lib/mercadopago", () => ({
  mpPayment: {
    create: vi.fn(),
    get: vi.fn(),
    cancel: vi.fn(),
  },
  mpStatusToLocal: vi.fn((s: string) => (s === "approved" ? "pago" : "pendente")),
}))

import { emitirCobranca, cancelarCobranca } from "@/app/actions/cobranca"
import { db } from "@/lib/db"
import { mpPayment } from "@/lib/mercadopago"

const m = db as unknown as {
  pagamento: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
  }
}

const mp = mpPayment as unknown as {
  create: ReturnType<typeof vi.fn>
  cancel: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
  m.pagamento.update.mockResolvedValue({})
  m.pagamento.findMany.mockResolvedValue([])
})

describe("emitirCobranca — PIX", () => {
  it("cria cobrança PIX e grava externalId", async () => {
    m.pagamento.findUnique.mockResolvedValue({
      id: 1,
      mesReferencia: "2026-06",
      dataVencimento: new Date("2026-06-10"),
      externalId: null,
      aluno: { nome: "João Silva", mensalidade: 150, email: "joao@test.com" },
    })
    mp.create.mockResolvedValue({
      id: "mp-123",
      status: "pending",
      point_of_interaction: {
        transaction_data: {
          qr_code: "00020126...",
          ticket_url: "https://mpago.la/abc",
        },
      },
    })

    const res = await emitirCobranca(1, "PIX")

    expect(res).toEqual({ success: true })
    expect(m.pagamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          canalPrevisto: "PIX",
          statusCobranca: "pendente",
          externalId: "mp-123",
          pixCopiaECola: "00020126...",
          externalUrl: "https://mpago.la/abc",
        }),
      })
    )
  })

  it("retorna erro se pagamento já tem externalId", async () => {
    m.pagamento.findUnique.mockResolvedValue({
      id: 1,
      externalId: "mp-existente",
      aluno: { nome: "João", mensalidade: 150, email: null },
    })

    const res = await emitirCobranca(1, "PIX")

    expect(res).toEqual({ error: "Cobrança já emitida para este pagamento." })
    expect(mp.create).not.toHaveBeenCalled()
  })
})

describe("cancelarCobranca", () => {
  it("cancela no MP e limpa campos locais", async () => {
    m.pagamento.findUnique.mockResolvedValue({
      id: 2,
      externalId: "mp-456",
      aluno: { nome: "Maria" },
    })
    mp.cancel.mockResolvedValue({ status: "cancelled" })

    const res = await cancelarCobranca(2)

    expect(res).toEqual({ success: true })
    expect(mp.cancel).toHaveBeenCalledWith({ id: "mp-456" })
    expect(m.pagamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: expect.objectContaining({
          statusCobranca: "cancelado",
          externalId: null,
          linhaDigitavel: null,
          pixCopiaECola: null,
          externalUrl: null,
        }),
      })
    )
  })
})
