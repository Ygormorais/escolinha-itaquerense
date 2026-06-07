import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    uniforme: {
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

import { getUniformes, adicionarUniforme, marcarEntregue, removerUniforme } from "@/app/actions/uniformes"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

const m = db as unknown as {
  uniforme: {
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.uniforme.findMany.mockResolvedValue([])
  m.uniforme.create.mockResolvedValue({ id: 1 })
  m.uniforme.update.mockResolvedValue({ id: 1 })
  m.uniforme.delete.mockResolvedValue({ id: 1 })
})

describe("getUniformes", () => {
  it("retorna uniformes do aluno ordenados por createdAt", async () => {
    const uniformes = [{ id: 1, item: "Camisa" }]
    m.uniforme.findMany.mockResolvedValue(uniformes)
    const res = await getUniformes(42)
    expect(res).toEqual(uniformes)
    expect(m.uniforme.findMany).toHaveBeenCalledWith({
      where: { alunoId: 42 },
      orderBy: { createdAt: "asc" },
    })
  })
})

describe("adicionarUniforme", () => {
  it("cria uniforme e invalida paths", async () => {
    const res = await adicionarUniforme(5, { item: "Camisa", tamanho: "M" })
    expect(res).toEqual({ success: true })
    expect(m.uniforme.create).toHaveBeenCalledWith({
      data: { alunoId: 5, item: "Camisa", tamanho: "M", observacoes: null },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/alunos/5")
    expect(revalidatePath).toHaveBeenCalledWith("/uniformes")
  })

  it("retorna erro quando create falha", async () => {
    m.uniforme.create.mockRejectedValue(new Error("DB error"))
    const res = await adicionarUniforme(5, { item: "Shorts" })
    expect(res).toEqual({ error: "DB error" })
  })
})

describe("marcarEntregue", () => {
  it("atualiza entregue=true e invalida paths", async () => {
    const res = await marcarEntregue(10, 5)
    expect(res).toEqual({ success: true })
    expect(m.uniforme.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: expect.objectContaining({ entregue: true }),
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith("/uniformes")
  })
})

describe("removerUniforme", () => {
  it("deleta uniforme e invalida paths", async () => {
    const res = await removerUniforme(7, 5)
    expect(res).toEqual({ success: true })
    expect(m.uniforme.delete).toHaveBeenCalledWith({ where: { id: 7 } })
    expect(revalidatePath).toHaveBeenCalledWith("/alunos/5")
    expect(revalidatePath).toHaveBeenCalledWith("/uniformes")
  })

  it("retorna erro quando delete falha", async () => {
    m.uniforme.delete.mockRejectedValue(new Error("FK violation"))
    const res = await removerUniforme(7, 5)
    expect(res).toEqual({ error: "FK violation" })
  })
})
