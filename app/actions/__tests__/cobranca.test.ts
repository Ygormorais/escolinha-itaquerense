import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    pagamento: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
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

import { emitirCobranca, cancelarCobranca, emitirCobrancasMes } from "@/app/actions/cobranca"
import { db } from "@/lib/db"
import { mpPayment } from "@/lib/mercadopago"

const m = db as unknown as {
  pagamento: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
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
  m.pagamento.updateMany.mockResolvedValue({ count: 1 })
  m.pagamento.findMany.mockResolvedValue([])
})

describe("emitirCobranca — PIX", () => {
  it("cria cobrança PIX e grava externalId", async () => {
    m.pagamento.findUnique.mockResolvedValue({
      id: 1,
      mesReferencia: "2026-06",
      dataVencimento: new Date("2026-06-10"),
      externalId: null,
      aluno: { nome: "João Silva", mensalidade: 150, desconto: 0, email: "joao@test.com" },
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
    expect(m.pagamento.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, externalId: null },
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
      aluno: { nome: "João", mensalidade: 150, desconto: 0, email: null },
    })

    const res = await emitirCobranca(1, "PIX")

    expect(res).toEqual({ error: "Cobrança já emitida para este pagamento." })
    expect(mp.create).not.toHaveBeenCalled()
  })
})

describe("emitirCobranca — valor e corrida", () => {
  const base = {
    id: 7, mesReferencia: "2026-06", dataVencimento: new Date("2026-06-10"), externalId: null, dataPagamento: null,
    valorDevido: 120, valorRecebido: 60, statusCobranca: null,
    aluno: { nome: "Ana", mensalidade: 150, desconto: 30, email: null },
  }

  it("cobra o restante devido (desconto e baixa parcial), não a mensalidade cheia", async () => {
    m.pagamento.findUnique.mockResolvedValue(base)
    mp.create.mockResolvedValue({ id: "mp-1", status: "pending", point_of_interaction: { transaction_data: { qr_code: "q", ticket_url: "u" } } })
    await emitirCobranca(7, "PIX")
    expect(mp.create).toHaveBeenCalledWith(expect.objectContaining({ body: expect.objectContaining({ transaction_amount: 60 }) }))
  })

  it("recusa mensalidade já paga ou sem restante", async () => {
    m.pagamento.findUnique.mockResolvedValueOnce({ ...base, dataPagamento: new Date("2026-06-05") })
    expect(await emitirCobranca(7, "PIX")).toEqual({ error: "Esta mensalidade já está paga." })
    m.pagamento.findUnique.mockResolvedValueOnce({ ...base, valorRecebido: 120 })
    expect(await emitirCobranca(7, "PIX")).toEqual({ error: "Não há valor a cobrar nesta mensalidade." })
    expect(mp.create).not.toHaveBeenCalled()
  })

  it("reserva antes de chamar o MP: sem reserva (corrida) não cria segunda cobrança", async () => {
    m.pagamento.findUnique.mockResolvedValue(base)
    m.pagamento.updateMany.mockResolvedValueOnce({ count: 0 })
    const res = await emitirCobranca(7, "PIX")
    expect(res).toEqual({ error: "Cobrança já emitida ou em emissão para este pagamento." })
    expect(mp.create).not.toHaveBeenCalled()
  })

  it("falha no MP desfaz a reserva", async () => {
    m.pagamento.findUnique.mockResolvedValue(base)
    mp.create.mockRejectedValue(new Error("MP down"))
    const res = await emitirCobranca(7, "PIX")
    expect(res).toEqual({ error: "MP down" })
    expect(m.pagamento.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: 7, externalId: null, statusCobranca: "emitindo" }, data: { statusCobranca: null } })
    )
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

describe("emitirCobranca — Boleto", () => {
  it("cria cobrança Boleto e grava linhaDigitavel", async () => {
    m.pagamento.findUnique.mockResolvedValue({
      id: 3,
      mesReferencia: "2026-06",
      dataVencimento: new Date("2026-06-10"),
      externalId: null,
      aluno: {
        nome: "Pedro",
        mensalidade: 200, desconto: 0,
        email: "pedro@test.com",
        responsavel: "Carlos Souza",
        responsavelRef: { nome: "Carlos Souza", email: "carlos@test.com", cpf: "191.191.191-00" },
      },
    })
    mp.create.mockResolvedValue({
      id: "mp-boleto-1",
      status: "pending",
      barcode: { content: "1234.5678 9012.3456 7890.1234 5 67890000020000" },
      transaction_details: { external_resource_url: "https://boleto.link/abc" },
    })

    const res = await emitirCobranca(3, "Boleto")

    expect(res).toEqual({ success: true })
    // Boleto exige nome completo + CPF do pagador (responsável)
    expect(mp.create).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          payment_method_id: "bolbradesco",
          payer: expect.objectContaining({
            email: "carlos@test.com",
            first_name: "Carlos",
            last_name: "Souza",
            identification: { type: "CPF", number: "19119119100" },
            address: expect.objectContaining({
              zip_code: expect.any(String),
              street_name: expect.any(String),
              city: expect.any(String),
              federal_unit: expect.any(String),
            }),
          }),
        }),
      })
    )
    expect(m.pagamento.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 3, externalId: null },
        data: expect.objectContaining({
          canalPrevisto: "Boleto",
          linhaDigitavel: "1234.5678 9012.3456 7890.1234 5 67890000020000",
          externalUrl: "https://boleto.link/abc",
        }),
      })
    )
  })

  it("recusa Boleto sem CPF do responsável", async () => {
    m.pagamento.findUnique.mockResolvedValue({
      id: 4,
      mesReferencia: "2026-06",
      dataVencimento: new Date("2026-06-10"),
      externalId: null,
      aluno: {
        nome: "Ana",
        mensalidade: 200, desconto: 0,
        email: "ana@test.com",
        responsavel: "Beatriz",
        responsavelRef: { nome: "Beatriz", email: "bia@test.com", cpf: null },
      },
    })

    const res = await emitirCobranca(4, "Boleto")

    expect(res).toEqual({
      error: "Boleto requer o CPF do responsável. Cadastre o CPF antes de emitir.",
    })
    expect(mp.create).not.toHaveBeenCalled()
  })
})

describe("emitirCobranca — erros", () => {
  it("retorna erro se pagamento não encontrado", async () => {
    m.pagamento.findUnique.mockResolvedValue(null)
    const res = await emitirCobranca(999, "PIX")
    expect(res).toEqual({ error: "Pagamento não encontrado." })
  })
})

describe("cancelarCobranca — erros", () => {
  it("retorna erro se pagamento não encontrado", async () => {
    m.pagamento.findUnique.mockResolvedValue(null)
    const res = await cancelarCobranca(999)
    expect(res).toEqual({ error: "Pagamento não encontrado." })
  })

  it("retorna erro se não há cobrança emitida", async () => {
    m.pagamento.findUnique.mockResolvedValue({ id: 5, externalId: null, aluno: { nome: "X" } })
    const res = await cancelarCobranca(5)
    expect(res).toEqual({ error: "Nenhuma cobrança emitida." })
  })
})

describe("emitirCobrancasMes", () => {
  it("emite cobranças para todos os pendentes do mês", async () => {
    m.pagamento.findMany.mockResolvedValue([{ id: 10 }, { id: 11 }])
    m.pagamento.findUnique
      .mockResolvedValueOnce({ id: 10, mesReferencia: "2026-06", dataVencimento: new Date("2026-06-10"), externalId: null, aluno: { nome: "A", mensalidade: 100, desconto: 0, email: null } })
      .mockResolvedValueOnce({ id: 11, mesReferencia: "2026-06", dataVencimento: new Date("2026-06-10"), externalId: null, aluno: { nome: "B", mensalidade: 120, desconto: 0, email: null } })
    mp.create.mockResolvedValue({ id: "mp-x", status: "pending", point_of_interaction: { transaction_data: { qr_code: "qr", ticket_url: "url" } } })

    const res = await emitirCobrancasMes("2026-06", "PIX")

    expect(res).toEqual({ emitidos: 2, erros: 0 })
    expect(mp.create).toHaveBeenCalledTimes(2)
  })

  it("retorna emitidos=0 quando não há pendentes no mês", async () => {
    m.pagamento.findMany.mockResolvedValue([])

    const res = await emitirCobrancasMes("2026-07", "Boleto")

    expect(res).toEqual({ emitidos: 0, erros: 0 })
    expect(mp.create).not.toHaveBeenCalled()
  })

  it("contabiliza erros quando MP falha para alguns", async () => {
    m.pagamento.findMany.mockResolvedValue([{ id: 20 }, { id: 21 }])
    m.pagamento.findUnique
      .mockResolvedValueOnce({ id: 20, mesReferencia: "2026-06", dataVencimento: new Date("2026-06-10"), externalId: null, aluno: { nome: "C", mensalidade: 100, desconto: 0, email: null } })
      .mockResolvedValueOnce({ id: 21, mesReferencia: "2026-06", dataVencimento: new Date("2026-06-10"), externalId: null, aluno: { nome: "D", mensalidade: 100, desconto: 0, email: null } })
    mp.create
      .mockResolvedValueOnce({ id: "mp-ok", status: "pending", point_of_interaction: { transaction_data: { qr_code: "q", ticket_url: "u" } } })
      .mockRejectedValueOnce(new Error("MP down"))

    const res = await emitirCobrancasMes("2026-06", "PIX")

    expect(res).toEqual({ emitidos: 1, erros: 1 })
  })
})
