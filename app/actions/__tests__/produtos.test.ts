import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    produto: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "admin" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { listarProdutos, criarProduto, atualizarProduto, removerProduto } from "@/app/actions/produtos"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

const m = db as unknown as {
  produto: {
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.produto.findMany.mockResolvedValue([])
  m.produto.create.mockResolvedValue({ id: 1 })
  m.produto.update.mockResolvedValue({ id: 1 })
  m.produto.delete.mockResolvedValue({ id: 1 })
})

describe("listarProdutos", () => {
  it("retorna lista de produtos ordenada por createdAt", async () => {
    const produtos = [{ id: 1, nome: "Camisa" }, { id: 2, nome: "Shorts" }]
    m.produto.findMany.mockResolvedValue(produtos)
    const res = await listarProdutos()
    expect(res).toEqual(produtos)
    expect(m.produto.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } })
  })
})

describe("criarProduto", () => {
  it("cria produto e invalida caches", async () => {
    await criarProduto({ nome: "Camisa Oficial", preco: 89.9, categoria: "uniforme" })
    expect(m.produto.create).toHaveBeenCalledWith({
      data: { nome: "Camisa Oficial", preco: 89.9, categoria: "uniforme" },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/configuracoes/produtos")
    expect(revalidatePath).toHaveBeenCalledWith("/responsavel/lojinha")
  })
})

describe("atualizarProduto", () => {
  it("atualiza produto pelo id e invalida caches", async () => {
    await atualizarProduto(5, { preco: 99.9, ativo: false })
    expect(m.produto.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { preco: 99.9, ativo: false },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/responsavel/lojinha")
  })
})

describe("removerProduto", () => {
  it("remove produto pelo id e invalida caches", async () => {
    await removerProduto(3)
    expect(m.produto.delete).toHaveBeenCalledWith({ where: { id: 3 } })
    expect(revalidatePath).toHaveBeenCalledWith("/configuracoes/produtos")
    expect(revalidatePath).toHaveBeenCalledWith("/responsavel/lojinha")
  })
})
