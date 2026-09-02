import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = { media: { create: vi.fn(), delete: vi.fn(), findUnique: vi.fn() } }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn().mockResolvedValue(undefined) }))
vi.mock("fs/promises", () => ({ unlink: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/uploads-path", () => ({ resolveUploadsDir: vi.fn(() => "/tmp/uploads/midia") }))

import { adicionarMidia, removerMidia } from "@/app/actions/midia"
import { db } from "@/lib/db"
import { unlink } from "fs/promises"

const m = db as unknown as { media: { create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> } }

const midiaValida = { tipo: "video" as const, titulo: "Gol do Gabriel", url: "https://youtube.com/watch?v=abc", partidaId: 1 }

beforeEach(() => {
  vi.clearAllMocks()
  m.media.create.mockResolvedValue({ id: 1 })
  m.media.delete.mockResolvedValue({})
  m.media.findUnique.mockResolvedValue({ titulo: "Gol do Gabriel", tipo: "video", url: "https://youtube.com/watch?v=abc" })
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
    expect(unlink).not.toHaveBeenCalled()
  })

  it("remove o arquivo quando a mídia foi enviada para o storage local", async () => {
    m.media.findUnique.mockResolvedValueOnce({
      titulo: "Treino",
      tipo: "video",
      url: "/uploads/midia/treino.mp4",
    })

    const res = await removerMidia(2)

    expect(res).toEqual({ success: true })
    expect(unlink).toHaveBeenCalledOnce()
    expect(vi.mocked(unlink).mock.calls[0]?.[0]).toEqual(expect.stringContaining("treino.mp4"))
  })

  it("retorna erro se delete falhar", async () => {
    m.media.delete.mockRejectedValueOnce(new Error("FK constraint"))
    const res = await removerMidia(99)
    expect(res).toEqual({ error: "FK constraint" })
  })
})
