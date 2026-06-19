import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    pagamento: {
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
    },
    aluno: { findMany: vi.fn() },
    $transaction: vi.fn((fns: Promise<unknown>[]) => Promise.all(fns)),
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))

vi.mock("@/app/actions/cobranca", () => ({
  cancelarCobranca: vi.fn().mockResolvedValue({ success: true }),
}))

import {
  registrarPagamento,
  registrarPagamentosLote,
  gerarMensalidadesMes,
  deletePagamento,
  marcarComoPago,
} from "@/app/actions/pagamentos"
import { db } from "@/lib/db"
import { cancelarCobranca } from "@/app/actions/cobranca"

const m = db as unknown as {
  pagamento: {
    update: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    createMany: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  aluno: { findMany: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.pagamento.update.mockResolvedValue({})
  m.pagamento.findUnique.mockResolvedValue({ mesReferencia: "Junho/2026", aluno: { nome: "Aluno A" } })
  m.pagamento.findMany.mockResolvedValue([])
  m.pagamento.createMany.mockResolvedValue({ count: 0 })
  m.pagamento.delete.mockResolvedValue({})
  m.aluno.findMany.mockResolvedValue([])
})

describe("registrarPagamento", () => {
  it("atualiza o pagamento e retorna sucesso", async () => {
    const res = await registrarPagamento(5, {
      dataPagamento: "2026-06-10",
      formaPagamento: "PIX",
      valorRecebido: 200,
    })
    expect(res).toEqual({ success: true })
    const data = m.pagamento.update.mock.calls[0][0].data
    expect(data).toMatchObject({
      formaPagamento: "PIX",
      valorRecebido: 200,
      observacoes: null,
      canalPrevisto: "PIX",
      statusCobranca: "pago",
    })
    expect(data.dataPagamento).toBeInstanceOf(Date)
  })

  it("retorna erro amigável quando o update falha", async () => {
    m.pagamento.update.mockRejectedValueOnce(new Error("constraint"))
    const res = await registrarPagamento(5, { dataPagamento: "2026-06-10", formaPagamento: "PIX", valorRecebido: 200 })
    expect(res).toEqual({ error: "constraint" })
  })
})

describe("marcarComoPago", () => {
  it("rejeita valor inválido (<= 0) sem tocar no banco", async () => {
    const res = await marcarComoPago(5, {
      dataPagamento: "2026-06-10",
      formaPagamento: "PIX",
      valorRecebido: 0,
    })
    expect(res).toEqual({ error: "Valor inválido" })
    expect(m.pagamento.update).not.toHaveBeenCalled()
  })

  it("rejeita valor não-finito (NaN) sem tocar no banco", async () => {
    const res = await marcarComoPago(5, {
      dataPagamento: "2026-06-10",
      formaPagamento: "PIX",
      valorRecebido: Number.NaN,
    })
    expect(res).toEqual({ error: "Valor inválido" })
    expect(m.pagamento.update).not.toHaveBeenCalled()
  })

  it("registra quando o valor é válido", async () => {
    const res = await marcarComoPago(5, {
      dataPagamento: "2026-06-10",
      formaPagamento: "PIX",
      valorRecebido: 150,
    })
    expect(res).toEqual({ success: true })
    expect(m.pagamento.update.mock.calls[0][0].data.valorRecebido).toBe(150)
    expect(m.pagamento.update.mock.calls[0][0].data.canalPrevisto).toBe("PIX")
    expect(m.pagamento.update.mock.calls[0][0].data.statusCobranca).toBe("pago")
  })
})

describe("registrarPagamentosLote", () => {
  it("usa a mensalidade de cada aluno como valor recebido", async () => {
    m.pagamento.findMany.mockResolvedValue([
      { id: 1, aluno: { nome: "A", mensalidade: 150 } },
      { id: 2, aluno: { nome: "B", mensalidade: 220 } },
    ])
    const res = await registrarPagamentosLote([1, 2], { dataPagamento: "2026-06-10", formaPagamento: "Dinheiro" })
    expect(res).toEqual({ atualizados: 2 })
    expect(m.pagamento.update).toHaveBeenCalledTimes(2)
    expect(m.pagamento.update.mock.calls[0][0].data.valorRecebido).toBe(150)
    expect(m.pagamento.update.mock.calls[1][0].data.valorRecebido).toBe(220)
    expect(m.pagamento.update.mock.calls[0][0].data.canalPrevisto).toBe("Dinheiro")
    expect(m.pagamento.update.mock.calls[0][0].data.statusCobranca).toBe("pago")
  })
})

describe("gerarMensalidadesMes", () => {
  it("cria mensalidades só para alunos ativos sem pagamento no mês", async () => {
    m.aluno.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])
    m.pagamento.findMany.mockResolvedValue([{ alunoId: 2 }]) // já tem pagamento
    const res = await gerarMensalidadesMes("2026-06")
    expect(res).toEqual({ criados: 2, ignorados: 1 })
    const criados = m.pagamento.createMany.mock.calls[0][0].data
    expect(criados.map((c: { alunoId: number }) => c.alunoId)).toEqual([1, 3])
    expect(criados[0]).toMatchObject({ mesReferencia: "2026-06" })
    expect(criados[0].dataVencimento).toBeInstanceOf(Date)
  })

  it("não chama createMany quando todos já têm pagamento", async () => {
    m.aluno.findMany.mockResolvedValue([{ id: 1 }])
    m.pagamento.findMany.mockResolvedValue([{ alunoId: 1 }])
    const res = await gerarMensalidadesMes("2026-06")
    expect(res).toEqual({ criados: 0, ignorados: 1 })
    expect(m.pagamento.createMany).not.toHaveBeenCalled()
  })

  it("corrida (unique P2002): retorna mensagem amigável, não erro cru", async () => {
    m.aluno.findMany.mockResolvedValue([{ id: 1 }])
    m.pagamento.findMany.mockResolvedValue([])
    m.pagamento.createMany.mockRejectedValueOnce(Object.assign(new Error("unique"), { code: "P2002" }))
    const res = await gerarMensalidadesMes("2026-06")
    expect(res).toEqual({ error: "As mensalidades deste mês já foram geradas (por outro processo). Recarregue a página." })
  })
})

describe("deletePagamento", () => {
  it("exclui e retorna sucesso", async () => {
    const res = await deletePagamento(9)
    expect(m.pagamento.delete).toHaveBeenCalledWith({ where: { id: 9 } })
    expect(res).toEqual({ success: true })
  })

  it("cancela a cobrança no MP antes de deletar quando externalId existe", async () => {
    m.pagamento.findUnique.mockResolvedValue({
      id: 3,
      externalId: "mp-789",
      aluno: { nome: "Carlos" },
      mesReferencia: "2026-06",
    })

    await deletePagamento(3)

    expect(cancelarCobranca).toHaveBeenCalledWith(3)
    expect(m.pagamento.delete).toHaveBeenCalledWith({ where: { id: 3 } })
  })
})

describe("marcarComoPago", () => {
  const base = { dataPagamento: "2026-06-10", formaPagamento: "PIX", valorRecebido: 150 }

  it("marca como pago com valor válido", async () => {
    const res = await marcarComoPago(1, base)
    expect(res).toEqual({ success: true })
    expect(m.pagamento.update).toHaveBeenCalled()
    expect(m.pagamento.update.mock.calls[0][0].data.canalPrevisto).toBe("PIX")
    expect(m.pagamento.update.mock.calls[0][0].data.statusCobranca).toBe("pago")
  })

  it("rejeita data inválida sem gravar", async () => {
    const res = await marcarComoPago(1, { ...base, dataPagamento: "2026-13-99" })
    expect(res).toEqual({ error: "Data de pagamento inválida" })
    expect(m.pagamento.update).not.toHaveBeenCalled()
  })

  it.each([0, -10, NaN, Infinity])("rejeita valorRecebido inválido (%s) sem gravar", async (valorRecebido) => {
    const res = await marcarComoPago(1, { ...base, valorRecebido })
    expect(res).toEqual({ error: "Valor inválido" })
    expect(m.pagamento.update).not.toHaveBeenCalled()
  })
})
