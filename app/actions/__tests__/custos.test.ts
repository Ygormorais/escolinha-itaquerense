import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    custo: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), createMany: vi.fn() },
    custoRecorrente: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
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
  custo: { create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> }
  custoRecorrente: { findMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.custo.create.mockResolvedValue({})
  m.custo.delete.mockResolvedValue({})
  m.custo.createMany.mockResolvedValue({ count: 0 })
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
    expect(res).toEqual({ criados: 2 })
    expect(m.custoRecorrente.findMany).toHaveBeenCalledWith({ where: { ativo: true } })
    const criados = m.custo.createMany.mock.calls[0][0].data
    expect(criados).toHaveLength(2)
    expect(criados[0]).toMatchObject({ categoria: "Aluguel", valor: 1200, comprovante: false })
    expect(criados[0].data).toBeInstanceOf(Date)
  })

  it("gera zero quando não há modelos ativos", async () => {
    const res = await gerarCustosRecorrentes("2026-06")
    expect(res).toEqual({ criados: 0 })
  })
})

describe("deleteCusto", () => {
  it("exclui e retorna sucesso", async () => {
    const res = await deleteCusto(3)
    expect(m.custo.delete).toHaveBeenCalledWith({ where: { id: 3 } })
    expect(res).toEqual({ success: true })
  })
})
