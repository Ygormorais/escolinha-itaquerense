import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    aluno: { findMany: vi.fn() },
    pagamento: { findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
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
  pagamento: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
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
  m.pagamento.updateMany.mockResolvedValue({ count: 1 })
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
  const ofxTransactions = [
    { fitid: "F1", date: new Date("2026-06-05"), amount: 150, memo: "PIX Lucas" },
    { fitid: "F2", date: new Date("2026-06-10"), amount: 200, memo: "PIX Ana" },
  ]

  beforeEach(() => {
    vi.mocked(parseOFX).mockReturnValue(ofxTransactions as never)
  })

  it("atualiza pagamentos selecionados e retorna contagem", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([
      { id: 10, dataPagamento: null },
      { id: 11, dataPagamento: null },
    ])
    const selecoes = [
      { pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" },
      { pagamentoId: 11, valor: 200, dataPagamento: "2026-06-10", fitid: "F2" },
    ]
    const res = await confirmarImportacaoOFX(selecoes, "<OFX>...</OFX>")
    expect(res).toEqual({ atualizados: 2 })
    expect(m.pagamento.updateMany).toHaveBeenCalledTimes(2)
  })

  it("grava formaPagamento e valor/data a partir da transação OFX reparseada, não do client", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: null }])
    await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150, dataPagamento: "2099-01-01", fitid: "F1" }],
      "<OFX>...</OFX>"
    )
    expect(m.pagamento.updateMany).toHaveBeenCalledWith({
      where: { id: 10, dataPagamento: null },
      data: {
        dataPagamento: ofxTransactions[0].date,
        valorRecebido: ofxTransactions[0].amount,
        formaPagamento: "Importação OFX",
      },
    })
  })

  it("inclui dataPagamento: null no where do updateMany (trava contra corrida TOCTOU)", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: null }])
    await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" }],
      "<OFX>...</OFX>"
    )
    expect(m.pagamento.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 10, dataPagamento: null } })
    )
  })

  it("conta como não atualizado quando updateMany afeta 0 linhas (pagamento baixado entre a consulta e o update)", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: null }])
    m.pagamento.updateMany.mockResolvedValueOnce({ count: 0 })
    const res = await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" }],
      "<OFX>...</OFX>"
    )
    expect(res).toEqual({ atualizados: 0 })
  })

  it("pula pagamento que já está pago (não confia só na trava do client)", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: new Date("2026-06-01") }])
    const res = await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" }],
      "<OFX>...</OFX>"
    )
    expect(res).toEqual({ atualizados: 0 })
    expect(m.pagamento.updateMany).not.toHaveBeenCalled()
  })

  it("aceita diferença de 1 centavo (tolerância)", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: null }])
    const res = await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150.01, dataPagamento: "2026-06-05", fitid: "F1" }],
      "<OFX>...</OFX>"
    )
    expect(res).toEqual({ atualizados: 1 })
  })

  it("pula seleção cujo valor não bate com a transação OFX real (fora da tolerância de 1 centavo)", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: null }])
    const res = await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150.02, dataPagamento: "2026-06-05", fitid: "F1" }],
      "<OFX>...</OFX>"
    )
    expect(res).toEqual({ atualizados: 0 })
    expect(m.pagamento.updateMany).not.toHaveBeenCalled()
  })

  it("pula seleção com fitid que não existe mais no OFX reparseado", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: null }])
    const res = await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "INEXISTENTE" }],
      "<OFX>...</OFX>"
    )
    expect(res).toEqual({ atualizados: 0 })
    expect(m.pagamento.updateMany).not.toHaveBeenCalled()
  })

  it("pula fitid duplicado entre as transações do OFX (ambíguo, não confiável)", async () => {
    vi.mocked(parseOFX).mockReturnValueOnce([
      { fitid: "F1", date: new Date("2026-06-05"), amount: 150, memo: "PIX Lucas" },
      { fitid: "F1", date: new Date("2026-06-06"), amount: 150, memo: "PIX Lucas (dup)" },
    ] as never)
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: null }])
    const res = await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" }],
      "<OFX>...</OFX>"
    )
    expect(res).toEqual({ atualizados: 0 })
    expect(m.pagamento.updateMany).not.toHaveBeenCalled()
  })

  it("pula seleções que reusam o mesmo fitid pra confirmar 2 pagamentos diferentes", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([
      { id: 10, dataPagamento: null },
      { id: 11, dataPagamento: null },
    ])
    const res = await confirmarImportacaoOFX(
      [
        { pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" },
        { pagamentoId: 11, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" },
      ],
      "<OFX>...</OFX>"
    )
    expect(res).toEqual({ atualizados: 0 })
    expect(m.pagamento.updateMany).not.toHaveBeenCalled()
  })

  it("revalida os paths de pagamentos após confirmar", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: null }])
    await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" }],
      "<OFX>...</OFX>"
    )
    expect(revalidatePath).toHaveBeenCalledWith("/pagamentos")
    expect(revalidatePath).toHaveBeenCalledWith("/inadimplencia")
    expect(revalidatePath).toHaveBeenCalledWith("/caixa")
  })

  it("retorna erro se updateMany falhar", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([{ id: 10, dataPagamento: null }])
    m.pagamento.updateMany.mockRejectedValueOnce(new Error("FK violation"))
    const res = await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" }],
      "<OFX>...</OFX>"
    )
    expect(res).toEqual({ error: "FK violation" })
  })

  it("retorna { atualizados: 0 } para lista vazia", async () => {
    m.pagamento.findMany.mockResolvedValueOnce([])
    const res = await confirmarImportacaoOFX([], "<OFX>...</OFX>")
    expect(res).toEqual({ atualizados: 0 })
    expect(m.pagamento.updateMany).not.toHaveBeenCalled()
  })

  it("rejeita conteúdo OFX acima de 5MB", async () => {
    const conteudoGrande = "a".repeat(5 * 1024 * 1024 + 1)
    const res = await confirmarImportacaoOFX(
      [{ pagamentoId: 10, valor: 150, dataPagamento: "2026-06-05", fitid: "F1" }],
      conteudoGrande
    )
    expect(res).toEqual({ error: "Arquivo excede o limite de 5MB." })
    expect(m.pagamento.updateMany).not.toHaveBeenCalled()
  })
})

describe("previewOFX - limite de tamanho", () => {
  it("rejeita conteúdo acima de 5MB antes de parsear", async () => {
    const conteudoGrande = "a".repeat(5 * 1024 * 1024 + 1)
    const res = await previewOFX(conteudoGrande)
    expect(res).toEqual({ error: "Arquivo excede o limite de 5MB." })
    expect(parseOFX).not.toHaveBeenCalled()
  })
})
