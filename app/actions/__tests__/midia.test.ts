import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = { media: { create: vi.fn(), delete: vi.fn() } }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { adicionarMidia, removerMidia } from "@/app/actions/midia"
import { db } from "@/lib/db"

const m = db as unknown as { media: { create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> } }

const midiaValida = { tipo: "video" as const, titulo: "Gol do Gabriel", url: "https://youtube.com/watch?v=abc", partidaId: 1 }

beforeEach(() => {
  vi.clearAllMocks()
  m.media.create.mockResolvedValue({ id: 1 })
  m.media.delete.mockResolvedValue({})
})

describe("adicionarMidia", () => {
  it("adiciona mídia válida com partidaId", async () => {
    const res = await adicionarMidia(midiaValida)
    expect(res).toEqual({ success: true })
    expect(m.media.create).toHaveBeenCalledWith({ data: midiaValida })
  })

  it("adiciona mídia válida com campeonatoId", async () => {
    const res = await adicionarMidia({ ...midiaValida, partidaId: undefined, campeonatoId: 2 })
    expect(res).toEqual({ success: true })
  })

  it("rejeita título vazio", async () => {
    const res = await adicionarMidia({ ...midiaValida, titulo: "   " })
    expect(res).toEqual({ error: "Título obrigatório" })
    expect(m.media.create).not.toHaveBeenCalled()
  })

  it("rejeita URL vazia", async () => {
    const res = await adicionarMidia({ ...midiaValida, url: "" })
    expect(res).toEqual({ error: "URL obrigatória" })
  })

  it("rejeita URL inválida", async () => {
    const res = await adicionarMidia({ ...midiaValida, url: "nao-e-url" })
    expect(res).toEqual({ error: "URL inválida" })
  })

  it("rejeita sem partida nem campeonato", async () => {
    const res = await adicionarMidia({ tipo: "fotos", titulo: "Fotos", url: "https://exemplo.com" })
    expect(res).toEqual({ error: "Vincule a uma partida ou campeonato" })
  })

  it("rejeita com partida E campeonato ao mesmo tempo", async () => {
    const res = await adicionarMidia({ ...midiaValida, campeonatoId: 1 })
    expect(res).toEqual({ error: "Vincule a apenas uma partida ou campeonato" })
  })
})

describe("removerMidia", () => {
  it("remove mídia pelo id", async () => {
    const res = await removerMidia(1)
    expect(res).toEqual({ success: true })
    expect(m.media.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it("retorna erro se delete falhar", async () => {
    m.media.delete.mockRejectedValueOnce(new Error("FK constraint"))
    const res = await removerMidia(99)
    expect(res).toEqual({ error: "FK constraint" })
  })
})
