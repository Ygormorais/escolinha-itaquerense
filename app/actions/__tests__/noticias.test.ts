import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    noticia: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { listarNoticias, criarNoticia, editarNoticia, deletarNoticia, togglePublicado } from "@/app/actions/noticias"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

const m = db as unknown as { noticia: { findMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> } }

const noticiaBase = { titulo: "Vitória na copa", subtitulo: "3 a 0", categoria: "Jogo", publicado: true, destaque: false }

beforeEach(() => {
  vi.clearAllMocks()
  m.noticia.findMany.mockResolvedValue([])
  m.noticia.create.mockResolvedValue({ id: 1, ...noticiaBase })
  m.noticia.update.mockResolvedValue({ id: 1, ...noticiaBase })
  m.noticia.delete.mockResolvedValue({})
})

describe("listarNoticias", () => {
  it("retorna todas as notícias ordenadas por data", async () => {
    const mock = [{ id: 1, titulo: "Notícia" }]
    m.noticia.findMany.mockResolvedValueOnce(mock)
    const res = await listarNoticias()
    expect(res).toEqual(mock)
    expect(m.noticia.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } })
  })
})

describe("criarNoticia", () => {
  it("cria notícia e revalida paths", async () => {
    const res = await criarNoticia(noticiaBase)
    expect(res).toMatchObject({ id: 1 })
    expect(m.noticia.create).toHaveBeenCalledWith({ data: noticiaBase })
    expect(revalidatePath).toHaveBeenCalledWith("/noticias")
    expect(revalidatePath).toHaveBeenCalledWith("/")
  })

  it("cria notícia sem campos opcionais", async () => {
    const input = { titulo: "Treino", categoria: "Treino", publicado: false, destaque: false }
    await criarNoticia(input)
    expect(m.noticia.create).toHaveBeenCalledWith({ data: input })
  })
})

describe("editarNoticia", () => {
  it("atualiza notícia existente", async () => {
    await editarNoticia(1, noticiaBase)
    expect(m.noticia.update).toHaveBeenCalledWith({ where: { id: 1 }, data: noticiaBase })
  })

  it("revalida / e /noticias após editar", async () => {
    await editarNoticia(1, noticiaBase)
    expect(revalidatePath).toHaveBeenCalledWith("/noticias")
    expect(revalidatePath).toHaveBeenCalledWith("/")
  })
})

describe("deletarNoticia", () => {
  it("deleta notícia pelo id", async () => {
    await deletarNoticia(1)
    expect(m.noticia.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it("revalida paths após deletar", async () => {
    await deletarNoticia(1)
    expect(revalidatePath).toHaveBeenCalledWith("/noticias")
    expect(revalidatePath).toHaveBeenCalledWith("/")
  })
})

describe("togglePublicado", () => {
  it("publica notícia", async () => {
    await togglePublicado(1, true)
    expect(m.noticia.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { publicado: true } })
  })

  it("despublica notícia", async () => {
    await togglePublicado(2, false)
    expect(m.noticia.update).toHaveBeenCalledWith({ where: { id: 2 }, data: { publicado: false } })
  })
})
