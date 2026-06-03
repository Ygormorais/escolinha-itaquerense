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
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))

import {
  registrarPagamento,
  registrarPagamentosLote,
  gerarMensalidadesMes,
  deletePagamento,
} from "@/app/actions/pagamentos"
import { db } from "@/lib/db"

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
    expect(data).toMatchObject({ formaPagamento: "PIX", valorRecebido: 200, observacoes: null })
    expect(data.dataPagamento).toBeInstanceOf(Date)
  })

  it("retorna erro amigável quando o update falha", async () => {
    m.pagamento.update.mockRejectedValueOnce(new Error("constraint"))
    const res = await registrarPagamento(5, { dataPagamento: "2026-06-10", formaPagamento: "PIX", valorRecebido: 200 })
    expect(res).toEqual({ error: "constraint" })
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
})

describe("deletePagamento", () => {
  it("exclui e retorna sucesso", async () => {
    const res = await deletePagamento(9)
    expect(m.pagamento.delete).toHaveBeenCalledWith({ where: { id: 9 } })
    expect(res).toEqual({ success: true })
  })
})
