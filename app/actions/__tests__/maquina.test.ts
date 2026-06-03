import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    transacaoMaquina: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    pagamento: { create: vi.fn() },
    aluno: { findMany: vi.fn(), findFirst: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/maquina-csv", () => ({
  parseCSV: vi.fn(),
  parseTransacoes: vi.fn(),
  detectarFormato: vi.fn(() => "Cielo"),
}))

import { importarCSV, reconciliarTransacao, getResumoMaquina } from "@/app/actions/maquina"
import { db } from "@/lib/db"
import { parseCSV, parseTransacoes } from "@/lib/maquina-csv"

const m = db as unknown as {
  transacaoMaquina: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  pagamento: { create: ReturnType<typeof vi.fn> }
}
const mParseCSV = parseCSV as unknown as ReturnType<typeof vi.fn>
const mParseTransacoes = parseTransacoes as unknown as ReturnType<typeof vi.fn>

function tx(over: Record<string, unknown> = {}) {
  return { dataTransacao: new Date("2026-06-05"), valor: 200, parcelas: 1, bandeira: "Visa", tipo: "Crédito", nomeNoCartao: "MARIA SILVA", parcela: "", ...over }
}

beforeEach(() => {
  vi.clearAllMocks()
  mParseCSV.mockReturnValue({ linhas: [["a"], ["b"]] })
  mParseTransacoes.mockReturnValue([tx()])
  m.transacaoMaquina.findFirst.mockResolvedValue(null)
  m.transacaoMaquina.create.mockResolvedValue({})
  m.transacaoMaquina.findUnique.mockResolvedValue(tx())
  m.transacaoMaquina.findMany.mockResolvedValue([])
  m.transacaoMaquina.update.mockResolvedValue({})
  m.pagamento.create.mockResolvedValue({ id: 99 })
})

describe("importarCSV", () => {
  it("erro quando o CSV não tem linhas", async () => {
    mParseCSV.mockReturnValue({ linhas: [] })
    const res = await importarCSV("", "f.csv")
    expect(res).toEqual({ error: "Nenhuma transação encontrada no CSV" })
  })

  it("erro quando nenhuma transação é interpretada", async () => {
    mParseTransacoes.mockReturnValue([])
    const res = await importarCSV("texto", "f.csv")
    expect(res).toEqual({ error: "Não foi possível interpretar as transações. Verifique o formato do CSV." })
  })

  it("importa novas e ignora duplicadas", async () => {
    mParseTransacoes.mockReturnValue([tx({ nomeNoCartao: "A" }), tx({ nomeNoCartao: "B" })])
    // primeira é nova (null), segunda já existe
    m.transacaoMaquina.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 1 })
    const res = await importarCSV("texto", "extrato.csv")
    expect(res).toMatchObject({ importadas: 1, ignoradas: 1, formato: "Cielo" })
    expect(m.transacaoMaquina.create).toHaveBeenCalledTimes(1)
  })
})

describe("reconciliarTransacao", () => {
  it("erro quando a transação não existe", async () => {
    m.transacaoMaquina.findUnique.mockResolvedValue(null)
    const res = await reconciliarTransacao(1, 5, "2026-06", "2026-06-10")
    expect(res).toEqual({ error: "Transação não encontrada" })
    expect(m.pagamento.create).not.toHaveBeenCalled()
  })

  it("cria pagamento e marca a transação como reconciliada", async () => {
    const res = await reconciliarTransacao(1, 5, "Junho/2026", "2026-06-10")
    expect(res).toEqual({ success: true })
    expect(m.pagamento.create.mock.calls[0][0].data).toMatchObject({
      alunoId: 5,
      mesReferencia: "Junho/2026",
      valorRecebido: 200,
      formaPagamento: "Cartão Crédito (Visa)",
    })
    expect(m.transacaoMaquina.update.mock.calls[0][0].data).toMatchObject({
      status: "reconciliado",
      alunoId: 5,
      pagamentoId: 99,
    })
  })
})

describe("getResumoMaquina", () => {
  it("agrega totais por status", async () => {
    m.transacaoMaquina.findMany.mockResolvedValue([
      { valor: 100, status: "pendente" },
      { valor: 200, status: "reconciliado" },
      { valor: 50, status: "pendente" },
    ])
    const res = await getResumoMaquina()
    expect(res).toEqual({
      total: 350,
      totalPendente: 150,
      totalReconciliado: 200,
      pendentes: 2,
      reconciliados: 1,
      totalTransacoes: 3,
    })
  })
})
