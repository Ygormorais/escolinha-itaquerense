import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    custo: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), createMany: vi.fn(), findMany: vi.fn() },
    custoRecorrente: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    $transaction: vi.fn(),
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))

import { createCusto, deleteCusto, gerarCustosRecorrentes, createCustoRecorrente, updateCustoRecorrente, deleteCustoRecorrente } from "@/app/actions/custos"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const requireAuthMock = requireAuth as unknown as ReturnType<typeof vi.fn>

const m = db as unknown as {
  custo: { create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
  custoRecorrente: { findMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
  m.$transaction.mockImplementation(async (cb: (tx: typeof m) => unknown) => cb(m))
  m.custo.create.mockResolvedValue({})
  m.custo.delete.mockResolvedValue({})
  m.custo.createMany.mockResolvedValue({ count: 0 })
  m.custo.findMany.mockResolvedValue([])
  m.custoRecorrente.findMany.mockResolvedValue([])
  m.custoRecorrente.create.mockResolvedValue({})
  m.custoRecorrente.update.mockResolvedValue({})
  m.custoRecorrente.delete.mockResolvedValue({})
})

describe("autorização — mutações de custo exigem autenticação", () => {
  const rec = { categoria: "c", descricao: "d", fornecedor: "f", valor: 10, formaPagamento: "PIX" }
  it("deleteCusto chama requireAuth", async () => {
    await deleteCusto(1)
    expect(requireAuthMock).toHaveBeenCalled()
  })
  it("createCustoRecorrente chama requireAuth", async () => {
    await createCustoRecorrente(rec)
    expect(requireAuthMock).toHaveBeenCalled()
  })
  it("updateCustoRecorrente chama requireAuth", async () => {
    await updateCustoRecorrente(1, { ...rec, ativo: true })
    expect(requireAuthMock).toHaveBeenCalled()
  })
  it("deleteCustoRecorrente chama requireAuth", async () => {
    await deleteCustoRecorrente(1)
    expect(requireAuthMock).toHaveBeenCalled()
  })
})

describe("createCusto", () => {
  const input = {
    data: "2026-06-01",
    categoria: "Aluguel",
    descricao: "Campo",
    fornecedor: "Arena X",
    valor: 1200,
    formaPagamento: "PIX",
    comprovante: true,
  }

  it("cria o custo e retorna sucesso", async () => {
    const res = await createCusto(input)
    expect(res).toEqual({ success: true })
    const data = m.custo.create.mock.calls[0][0].data
    expect(data).toMatchObject({ categoria: "Aluguel", valor: 1200, comprovante: true, observacoes: null })
    expect(data.data).toBeInstanceOf(Date)
  })

  it("retorna erro amigável quando o create falha", async () => {
    m.custo.create.mockRejectedValueOnce(new Error("db off"))
    const res = await createCusto(input)
    expect(res).toEqual({ error: "db off" })
  })

  it.each([0, -50, NaN, Infinity])("rejeita valor inválido (%s) sem gravar", async (valor) => {
    const res = await createCusto({ ...input, valor })
    expect(res).toEqual({ error: "Valor inválido" })
    expect(m.custo.create).not.toHaveBeenCalled()
  })
})

describe("validação de valor — custos recorrentes", () => {
  const rec = { categoria: "c", descricao: "d", fornecedor: "f", valor: 10, formaPagamento: "PIX" }
  it.each([0, -1, NaN, Infinity])("createCustoRecorrente rejeita valor %s", async (valor) => {
    const res = await createCustoRecorrente({ ...rec, valor })
    expect(res).toEqual({ error: "Valor inválido" })
    expect(m.custoRecorrente.create).not.toHaveBeenCalled()
  })
  it.each([0, -1, NaN, Infinity])("updateCustoRecorrente rejeita valor %s", async (valor) => {
    const res = await updateCustoRecorrente(1, { ...rec, valor, ativo: true })
    expect(res).toEqual({ error: "Valor inválido" })
    expect(m.custoRecorrente.update).not.toHaveBeenCalled()
  })
})

describe("gerarCustosRecorrentes", () => {
  it("gera um custo por modelo ativo, com comprovante falso", async () => {
    m.custoRecorrente.findMany.mockResolvedValue([
      { categoria: "Aluguel", descricao: "Campo", fornecedor: "Arena X", valor: 1200, formaPagamento: "PIX" },
      { categoria: "Salário", descricao: "Técnico", fornecedor: "Prof.", valor: 800, formaPagamento: "PIX" },
    ])
    const res = await gerarCustosRecorrentes("2026-06")
    expect(res).toEqual({ criados: 2, jaExistentes: 0 })
    expect(m.custoRecorrente.findMany).toHaveBeenCalledWith({ where: { ativo: true } })
    const criados = m.custo.createMany.mock.calls[0][0].data
    expect(criados).toHaveLength(2)
    expect(criados[0]).toMatchObject({ categoria: "Aluguel", valor: 1200, comprovante: false })
    expect(criados[0].data).toBeInstanceOf(Date)
  })

  it("gera zero quando não há modelos ativos", async () => {
    const res = await gerarCustosRecorrentes("2026-06")
    expect(res).toEqual({ criados: 0, jaExistentes: 0 })
    expect(m.custo.createMany).not.toHaveBeenCalled()
  })

  const aluguel = { categoria: "Aluguel", descricao: "Campo", fornecedor: "Arena X", valor: 1200, formaPagamento: "PIX" }
  const salario = { categoria: "Salário", descricao: "Técnico", fornecedor: "Prof.", valor: 800, formaPagamento: "PIX" }

  it("não duplica custo que já existe no mês", async () => {
    m.custoRecorrente.findMany.mockResolvedValue([aluguel, salario])
    m.custo.findMany.mockResolvedValue([{ categoria: "aluguel ", descricao: "Campo", fornecedor: "Arena X" }])
    const res = await gerarCustosRecorrentes("2026-06")
    expect(res).toEqual({ criados: 1, jaExistentes: 1 })
    const criados = m.custo.createMany.mock.calls[0][0].data
    expect(criados).toHaveLength(1)
    expect(criados[0]).toMatchObject({ categoria: "Salário" })
  })

  it("segunda geração do mesmo mês não cria nada", async () => {
    m.custoRecorrente.findMany.mockResolvedValue([aluguel, salario])
    m.custo.findMany.mockResolvedValue([aluguel, salario])
    const res = await gerarCustosRecorrentes("2026-06")
    expect(res).toEqual({ criados: 0, jaExistentes: 2 })
    expect(m.custo.createMany).not.toHaveBeenCalled()
  })

  it("consulta só o intervalo do mês pedido", async () => {
    await gerarCustosRecorrentes("2026-12")
    const where = m.custo.findMany.mock.calls[0][0].where.data
    expect(where.gte).toEqual(new Date(2026, 11, 1))
    expect(where.lt).toEqual(new Date(2027, 0, 1))
  })

  it.each(["junho", "2026-13", "2026-00", "2026-6"])("rejeita mês inválido %s", async (mes) => {
    expect(await gerarCustosRecorrentes(mes)).toEqual({ error: "Mês inválido" })
    expect(m.custo.createMany).not.toHaveBeenCalled()
  })

  it("duas gerações simultâneas do mesmo mês não duplicam", async () => {
    const guardados: { categoria: string; descricao: string; fornecedor: string }[] = []
    m.custoRecorrente.findMany.mockResolvedValue([aluguel, salario])
    // leitura lenta: sem a fila, as duas chamadas leriam o mês vazio antes de qualquer inserção
    m.custo.findMany.mockImplementation(async () => {
      const foto = [...guardados]
      await new Promise((r) => setTimeout(r, 10))
      return foto
    })
    m.custo.createMany.mockImplementation(async ({ data }: { data: typeof guardados }) => {
      guardados.push(...data)
      return { count: data.length }
    })
    const [a, b] = await Promise.all([gerarCustosRecorrentes("2026-06"), gerarCustosRecorrentes("2026-06")])
    expect([a, b]).toEqual([{ criados: 2, jaExistentes: 0 }, { criados: 0, jaExistentes: 2 }])
    expect(guardados).toHaveLength(2)
  })

  it("faz checagem e inserção dentro da mesma transação", async () => {
    m.custoRecorrente.findMany.mockResolvedValue([aluguel])
    await gerarCustosRecorrentes("2026-06")
    expect(m.$transaction).toHaveBeenCalledTimes(1)
  })
})

describe("deleteCusto", () => {
  it("exclui e retorna sucesso", async () => {
    const res = await deleteCusto(3)
    expect(m.custo.delete).toHaveBeenCalledWith({ where: { id: 3 } })
    expect(res).toEqual({ success: true })
  })
})
