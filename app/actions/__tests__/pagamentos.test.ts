import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    pagamento: {
      update: vi.fn(),
      updateMany: vi.fn(),
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

vi.mock("@/lib/baixa", () => ({
  emitirReciboSeguro: vi.fn().mockResolvedValue({ id: 1, numero: "REC-1", codigoVerificacao: "COD1" }),
  cancelarRecibosDoPagamento: vi.fn().mockResolvedValue(1),
}))

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
import { cancelarRecibosDoPagamento, emitirReciboSeguro } from "@/lib/baixa"

const m = db as unknown as {
  pagamento: {
    update: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
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
  m.pagamento.updateMany.mockResolvedValue({ count: 1 })
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
    expect(res).toMatchObject({ success: true })
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
    expect(res).toMatchObject({ success: true })
    expect(m.pagamento.update.mock.calls[0][0].data.valorRecebido).toBe(150)
    expect(m.pagamento.update.mock.calls[0][0].data.canalPrevisto).toBe("PIX")
    expect(m.pagamento.update.mock.calls[0][0].data.statusCobranca).toBe("pago")
  })
})

describe("registrarPagamentosLote", () => {
  it("usa o valor devido (com desconto) de cada mensalidade como valor recebido", async () => {
    m.pagamento.findMany.mockResolvedValue([
      { id: 1, dataPagamento: null, valorDevido: 150, aluno: { nome: "A", mensalidade: 180, desconto: 30 } },
      { id: 2, dataPagamento: null, valorDevido: null, aluno: { nome: "B", mensalidade: 220, desconto: 0 } },
    ])
    const res = await registrarPagamentosLote([1, 2], { dataPagamento: "2026-06-10", formaPagamento: "Dinheiro" })
    expect(res).toEqual({ atualizados: 2 })
    expect(m.pagamento.updateMany).toHaveBeenCalledTimes(2)
    expect(m.pagamento.updateMany.mock.calls[0][0].data.valorRecebido).toBe(150)
    expect(m.pagamento.updateMany.mock.calls[1][0].data.valorRecebido).toBe(220)
    expect(m.pagamento.updateMany.mock.calls[0][0].data.canalPrevisto).toBe("Dinheiro")
    expect(m.pagamento.updateMany.mock.calls[0][0].data.statusCobranca).toBe("pago")
  })

  it("pula pagamentos que já estão pagos, sem quebrar o resto do lote (trava server-side)", async () => {
    m.pagamento.findMany.mockResolvedValue([
      { id: 1, dataPagamento: new Date("2026-05-01"), aluno: { nome: "A", mensalidade: 150 } },
      { id: 2, dataPagamento: null, aluno: { nome: "B", mensalidade: 220 } },
    ])
    const res = await registrarPagamentosLote([1, 2], { dataPagamento: "2026-06-10", formaPagamento: "Dinheiro" })
    expect(res).toEqual({ atualizados: 1 })
    expect(m.pagamento.updateMany).toHaveBeenCalledTimes(1)
    expect(m.pagamento.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 2, dataPagamento: null } })
    )
  })

  it("inclui dataPagamento: null no where do updateMany (trava contra corrida)", async () => {
    m.pagamento.findMany.mockResolvedValue([
      { id: 1, dataPagamento: null, aluno: { nome: "A", mensalidade: 150 } },
    ])
    await registrarPagamentosLote([1], { dataPagamento: "2026-06-10", formaPagamento: "Dinheiro" })
    expect(m.pagamento.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, dataPagamento: null } })
    )
  })

  it("conta como não atualizado quando o updateMany afeta 0 linhas (pagamento baixado entre a consulta e o update)", async () => {
    m.pagamento.findMany.mockResolvedValue([
      { id: 1, dataPagamento: null, aluno: { nome: "A", mensalidade: 150 } },
      { id: 2, dataPagamento: null, aluno: { nome: "B", mensalidade: 220 } },
    ])
    m.pagamento.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
    const res = await registrarPagamentosLote([1, 2], { dataPagamento: "2026-06-10", formaPagamento: "Dinheiro" })
    expect(res).toEqual({ atualizados: 1 })
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
    expect(res).toMatchObject({ success: true })
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

describe("recibo da baixa", () => {
  const emitir = emitirReciboSeguro as unknown as ReturnType<typeof vi.fn>
  const cancelar = cancelarRecibosDoPagamento as unknown as ReturnType<typeof vi.fn>

  it("registrar pagamento emite recibo com o valor recebido e devolve o código", async () => {
    const res = await registrarPagamento(5, { dataPagamento: "2026-06-10", formaPagamento: "PIX", valorRecebido: 200 })
    expect(emitir).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ pagamentoId: 5, valor: 200, formaPagamento: "PIX", emitidoPor: "secretaria" }))
    expect(res).toEqual({ success: true, recibo: { numero: "REC-1", codigoVerificacao: "COD1" } })
  })

  it("marcar como pago emite recibo", async () => {
    await marcarComoPago(5, { dataPagamento: "2026-06-10", formaPagamento: "PIX", valorRecebido: 150 })
    expect(emitir).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ pagamentoId: 5, valor: 150 }))
  })

  it("lote emite um recibo por mensalidade baixada, com o valor devido", async () => {
    m.pagamento.findMany.mockResolvedValue([
      { id: 1, dataPagamento: null, valorDevido: 150, aluno: { nome: "A", mensalidade: 180, desconto: 30 } },
      { id: 2, dataPagamento: null, valorDevido: 220, aluno: { nome: "B", mensalidade: 220, desconto: 0 } },
    ])
    m.pagamento.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 })
    await registrarPagamentosLote([1, 2], { dataPagamento: "2026-06-10", formaPagamento: "Dinheiro" })
    expect(emitir).toHaveBeenCalledTimes(1)
    expect(emitir).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ pagamentoId: 1, valor: 150, formaPagamento: "Dinheiro" }))
  })

  it("falha ao emitir recibo não desfaz a baixa", async () => {
    emitir.mockResolvedValueOnce(null)
    const res = await registrarPagamento(5, { dataPagamento: "2026-06-10", formaPagamento: "PIX", valorRecebido: 200 })
    expect(m.pagamento.update).toHaveBeenCalled()
    expect(res).toEqual({ success: true, recibo: null })
  })

  it("excluir pagamento cancela os recibos dele antes de excluir", async () => {
    const ordem: string[] = []
    cancelar.mockImplementationOnce(async () => { ordem.push("cancelar"); return 1 })
    m.pagamento.delete.mockImplementationOnce(async () => { ordem.push("excluir"); return {} })
    await deletePagamento(9)
    expect(cancelar).toHaveBeenCalledWith(expect.anything(), 9, "secretaria")
    expect(ordem).toEqual(["cancelar", "excluir"])
  })
})
