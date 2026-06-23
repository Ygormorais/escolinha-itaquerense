import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    lancamentoBancario: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/extrato-csv", () => ({
  parseExtratoCSV: vi.fn(),
}))

import {
  importarExtrato, getLancamentos, getResumoExtrato,
  ignorarLancamento, deletarLancamento, categorizarLancamento,
} from "@/app/actions/extrato"
import { db } from "@/lib/db"
import { parseExtratoCSV } from "@/lib/extrato-csv"

const m = db as unknown as {
  lancamentoBancario: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    aggregate: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

const lancamentoMock = { data: new Date("2026-06-01"), descricao: "PIX recebido", valor: 150, tipo: "entrada" as const, saldo: null }

beforeEach(() => {
  vi.clearAllMocks()
  m.lancamentoBancario.findFirst.mockResolvedValue(null)
  m.lancamentoBancario.create.mockResolvedValue({})
  m.lancamentoBancario.findMany.mockResolvedValue([])
  m.lancamentoBancario.aggregate.mockResolvedValue({ _sum: { valor: 0 }, _count: 0 })
  m.lancamentoBancario.count.mockResolvedValue(0)
  m.lancamentoBancario.update.mockResolvedValue({})
  m.lancamentoBancario.delete.mockResolvedValue({})
})

describe("importarExtrato", () => {
  it("retorna erro se o parser retornar erro", async () => {
    vi.mocked(parseExtratoCSV).mockReturnValueOnce({ erro: "Formato não reconhecido", lancamentos: [], banco: "" })
    const res = await importarExtrato("csv...", "extrato.csv")
    expect(res).toEqual({ error: "Formato não reconhecido" })
  })

  it("retorna erro se não houver lançamentos", async () => {
    vi.mocked(parseExtratoCSV).mockReturnValueOnce({ lancamentos: [], banco: "Bradesco", erro: undefined })
    const res = await importarExtrato("csv...", "extrato.csv")
    expect(res).toEqual({ error: "Nenhum lançamento encontrado." })
  })

  it("importa lançamentos novos e ignora duplicatas", async () => {
    vi.mocked(parseExtratoCSV).mockReturnValueOnce({
      lancamentos: [lancamentoMock, lancamentoMock],
      banco: "Bradesco",
      erro: undefined,
    })
    // primeiro é novo, segundo é duplicata
    m.lancamentoBancario.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 99 })
    const res = await importarExtrato("csv...", "extrato.csv")
    expect(res).toEqual({ importados: 1, ignorados: 1, banco: "Bradesco" })
    expect(m.lancamentoBancario.create).toHaveBeenCalledTimes(1)
  })
})

describe("getLancamentos", () => {
  it("sem filtros busca tudo", async () => {
    await getLancamentos()
    expect(m.lancamentoBancario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it("filtra por tipo quando não é 'todos'", async () => {
    await getLancamentos({ tipo: "entrada" })
    expect(m.lancamentoBancario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tipo: "entrada" } })
    )
  })

  it("ignora tipo 'todos'", async () => {
    await getLancamentos({ tipo: "todos" })
    expect(m.lancamentoBancario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it("filtra por mês com range de datas correto", async () => {
    await getLancamentos({ mes: "2026-06" })
    const call = m.lancamentoBancario.findMany.mock.calls[0][0]
    expect(call.where.data.gte).toEqual(new Date(2026, 5, 1))
    expect(call.where.data.lt).toEqual(new Date(2026, 6, 1))
  })
})

describe("getResumoExtrato", () => {
  it("retorna zeros quando não há lançamentos", async () => {
    m.lancamentoBancario.aggregate
      .mockResolvedValueOnce({ _sum: { valor: null }, _count: 0 })
      .mockResolvedValueOnce({ _sum: { valor: null }, _count: 0 })
    const res = await getResumoExtrato()
    expect(res).toEqual({ totalEntradas: 0, totalSaidas: 0, saldo: 0, qtdEntradas: 0, qtdSaidas: 0, total: 0 })
  })

  it("calcula saldo corretamente", async () => {
    m.lancamentoBancario.aggregate
      .mockResolvedValueOnce({ _sum: { valor: 1000 }, _count: 5 })
      .mockResolvedValueOnce({ _sum: { valor: -300 }, _count: 2 })
    m.lancamentoBancario.count.mockResolvedValueOnce(7)
    const res = await getResumoExtrato("2026-06")
    expect(res.totalEntradas).toBe(1000)
    expect(res.totalSaidas).toBe(300)
    expect(res.saldo).toBe(700)
  })
})

describe("ignorarLancamento", () => {
  it("marca status como ignorado", async () => {
    await ignorarLancamento(5)
    expect(m.lancamentoBancario.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { status: "ignorado" } })
  })
})

describe("deletarLancamento", () => {
  it("deleta pelo id", async () => {
    await deletarLancamento(3)
    expect(m.lancamentoBancario.delete).toHaveBeenCalledWith({ where: { id: 3 } })
  })
})

describe("categorizarLancamento", () => {
  it("salva categoria quando preenchida", async () => {
    await categorizarLancamento(1, "Alimentação")
    expect(m.lancamentoBancario.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { categoria: "Alimentação" } })
  })

  it("salva null quando categoria é string vazia", async () => {
    await categorizarLancamento(1, "")
    expect(m.lancamentoBancario.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { categoria: null } })
  })
})
