import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    aluno: { findMany: vi.fn() },
    pagamento: { findMany: vi.fn(), update: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/ofx-parser", () => ({ parseOFX: vi.fn() }))
vi.mock("@/lib/ofx-matcher", () => ({ matchTransactions: vi.fn() }))

import { previewOFX, confirmarImportacaoOFX } from "@/app/actions/importar-extrato"
import { db } from "@/lib/db"
import { parseOFX } from "@/lib/ofx-parser"
import { matchTransactions } from "@/lib/ofx-matcher"
import { revalidatePath } from "next/cache"

const m = db as unknown as {
  aluno: { findMany: ReturnType<typeof vi.fn> }
  pagamento: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}

const transactions = [{ id: "T1", valor: 150, data: "2026-06-01", descricao: "PIX Lucas" }]
const alunos = [{ id: 1, nome: "Lucas Oliveira" }]
const pagamentos = [{ id: 10, alunoId: 1, mesReferencia: "2026-06", dataPagamento: null }]
const matchResults = [{ transacao: transactions[0], pagamento: pagamentos[0], confianca: 0.9 }]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(parseOFX).mockReturnValue(transactions as never)
  vi.mocked(matchTransactions).mockReturnValue(matchResults as never)
  m.aluno.findMany.mockResolvedValue(alunos)
  m.pagamento.findMany.mockResolvedValue(pagamentos)
  m.pagamento.update.mockResolvedValue({})
})

describe("previewOFX", () => {
  it("retorna lista de matches para arquivo OFX válido", async () => {
    const res = await previewOFX("<OFX>...</OFX>")
    expect(res).toEqual(matchResults)
    expect(parseOFX).toHaveBeenCalledWith("<OFX>...</OFX>")
    expect(matchTransactions).toHaveBeenCalledWith(transactions, alunos, pagamentos)
  })

  it("busca alunos ativos e pagamentos pendentes", async () => {
    await previewOFX("<OFX>...</OFX>")
    expect(m.aluno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "Ativo" } })
    )
    expect(m.pagamento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dataPagamento: null } })
    )
  })

  it("retorna erro se parseOFX lançar exceção", async () => {
    vi.mocked(parseOFX).mockImplementationOnce(() => { throw new Error("Formato inválido") })
    const res = await previewOFX("lixo")
    expect(res).toEqual({ error: "Formato inválido" })
  })

  it("retorna mensagem genérica para erro não-Error", async () => {
    vi.mocked(parseOFX).mockImplementationOnce(() => { throw "falha estranha" })
    const res = await previewOFX("x")
    expect(res).toEqual({ error: "Erro ao processar arquivo OFX" })
  })
})

describe("confirmarImportacaoOFX", () => {
  it("atualiza pagamentos selecionados e retorna contagem", async () => {
    const selecoes = [
      { pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05" },
      { pagamentoId: 11, valor: 200, dataPagamento: "2026-06-10" },
    ]
    const res = await confirmarImportacaoOFX(selecoes)
    expect(res).toEqual({ atualizados: 2 })
    expect(m.pagamento.update).toHaveBeenCalledTimes(2)
  })

  it("grava formaPagamento como 'Importação OFX'", async () => {
    await confirmarImportacaoOFX([{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05" }])
    expect(m.pagamento.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        dataPagamento: new Date("2026-06-05"),
        valorRecebido: 150,
        formaPagamento: "Importação OFX",
      },
    })
  })

  it("revalida os paths de pagamentos após confirmar", async () => {
    await confirmarImportacaoOFX([{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05" }])
    expect(revalidatePath).toHaveBeenCalledWith("/pagamentos")
    expect(revalidatePath).toHaveBeenCalledWith("/inadimplencia")
    expect(revalidatePath).toHaveBeenCalledWith("/caixa")
  })

  it("retorna erro se update falhar", async () => {
    m.pagamento.update.mockRejectedValueOnce(new Error("FK violation"))
    const res = await confirmarImportacaoOFX([{ pagamentoId: 99, valor: 100, dataPagamento: "2026-06-01" }])
    expect(res).toEqual({ error: "FK violation" })
  })

  it("retorna { atualizados: 0 } para lista vazia", async () => {
    const res = await confirmarImportacaoOFX([])
    expect(res).toEqual({ atualizados: 0 })
    expect(m.pagamento.update).not.toHaveBeenCalled()
  })
})
