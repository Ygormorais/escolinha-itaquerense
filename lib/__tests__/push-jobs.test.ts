import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    pagamento: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/push", () => ({
  sendPushToResponsavel: vi.fn(),
}))

import { runPushVencimento, runPushInadimplentes } from "../push-jobs"
import { db } from "@/lib/db"
import { sendPushToResponsavel } from "@/lib/push"

const mockDb = db as unknown as { pagamento: { findMany: ReturnType<typeof vi.fn> } }
const mockSendPush = sendPushToResponsavel as ReturnType<typeof vi.fn>

function makePagamento(overrides: { responsavelId?: number | null; vencimento?: Date } = {}) {
  return {
    id: 1,
    mesReferencia: "2026-07",
    dataVencimento: overrides.vencimento ?? new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    aluno: {
      nome: "João Silva",
      responsavelId: overrides.responsavelId !== undefined ? overrides.responsavelId : 10,
      mensalidade: 150,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSendPush.mockResolvedValue(undefined)
})

describe("runPushVencimento", () => {
  it("envia push para responsável com mensalidade vencendo", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento()])
    const res = await runPushVencimento()
    expect(mockSendPush).toHaveBeenCalledOnce()
    expect(mockSendPush.mock.calls[0][0]).toBe(10)
    expect(mockSendPush.mock.calls[0][1]).toBe("vencimento")
    expect(res).toMatchObject({ enviados: 1, semCadastro: 0 })
  })

  it("conta semCadastro quando responsavelId é null", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento({ responsavelId: null })])
    const res = await runPushVencimento()
    expect(mockSendPush).not.toHaveBeenCalled()
    expect(res).toMatchObject({ enviados: 0, semCadastro: 1 })
  })

  it("retorna error quando DB lança exceção", async () => {
    mockDb.pagamento.findMany.mockRejectedValue(new Error("db down"))
    const res = await runPushVencimento()
    expect(res).toMatchObject({ error: "db down" })
  })

  it("retorna zeros para lista vazia", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([])
    const res = await runPushVencimento()
    expect(res).toMatchObject({ enviados: 0, semCadastro: 0 })
  })
})

describe("runPushInadimplentes", () => {
  it("envia push com título 'em atraso' mencionando dias", async () => {
    const vencimento = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento({ vencimento })])
    const res = await runPushInadimplentes()
    expect(mockSendPush).toHaveBeenCalledOnce()
    const opts = mockSendPush.mock.calls[0][2] as { title: string; body: string }
    expect(opts.title).toContain("atraso")
    expect(opts.body).toContain("dia")
    expect(res).toMatchObject({ enviados: 1, semCadastro: 0 })
  })

  it("conta semCadastro para aluno sem responsável", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento({ responsavelId: null })])
    const res = await runPushInadimplentes()
    expect(mockSendPush).not.toHaveBeenCalled()
    expect(res).toMatchObject({ enviados: 0, semCadastro: 1 })
  })

  it("retorna error quando DB lança exceção", async () => {
    mockDb.pagamento.findMany.mockRejectedValue(new Error("timeout"))
    const res = await runPushInadimplentes()
    expect(res).toMatchObject({ error: "timeout" })
  })
})
