import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    noticia: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))

import { listarNoticias, criarNoticia, editarNoticia, deletarNoticia, togglePublicado } from "@/app/actions/noticias"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const m = db as unknown as { noticia: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> } }

const noticiaBase = { titulo: "Vitória na copa", subtitulo: "3 a 0", categoria: "Jogo", publicado: true, destaque: false }

beforeEach(() => {
  vi.clearAllMocks()
  m.noticia.findMany.mockResolvedValue([])
  m.noticia.findUnique.mockImplementation(async (arg: { where: { id?: number; slug?: string } }) =>
    arg.where.slug ? null : { titulo: "Vitória na copa", slug: "vitoria-na-copa" },
  )
  m.noticia.create.mockResolvedValue({ id: 1, ...noticiaBase })
  m.noticia.update.mockResolvedValue({ id: 1, ...noticiaBase })
  m.noticia.delete.mockResolvedValue({})
})

describe("listarNoticias", () => {
  it("exige admin ou secretaria (rascunhos não são públicos)", async () => {
    m.noticia.findMany.mockResolvedValueOnce([])
    await listarNoticias()
    expect(requireAuth).toHaveBeenCalledWith(["admin", "secretaria"])
  })

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
    expect(m.noticia.create).toHaveBeenCalledWith({
      data: { ...noticiaBase, corpo: null, videoUrl: null, slug: "vitoria-na-copa" },
    })
    expect(revalidatePath).toHaveBeenCalledWith("/noticias")
    expect(revalidatePath).toHaveBeenCalledWith("/")
  })

  it("cria notícia sem campos opcionais", async () => {
    const input = { titulo: "Treino", categoria: "Treino", publicado: false, destaque: false }
    await criarNoticia(input)
    expect(m.noticia.create).toHaveBeenCalledWith({
      data: { ...input, corpo: null, videoUrl: null, slug: "treino" },
    })
  })

  it("gera slug único quando o título já existe", async () => {
    m.noticia.findUnique.mockImplementation(async (arg: { where: { slug?: string } }) =>
      arg.where.slug === "treino" ? { id: 9 } : null,
    )
    await criarNoticia({ titulo: "Treino", categoria: "Treino", publicado: false, destaque: false })
    expect(m.noticia.create.mock.calls[0][0].data.slug).toBe("treino-2")
  })

  it("guarda texto e vídeo do YouTube, e rejeita link que não é do YouTube", async () => {
    await criarNoticia({ ...noticiaBase, corpo: "Texto.", videoUrl: "https://youtu.be/dQw4w9WgXcQ" })
    expect(m.noticia.create.mock.calls[0][0].data).toMatchObject({ corpo: "Texto.", videoUrl: "https://youtu.be/dQw4w9WgXcQ" })
    m.noticia.create.mockClear()
    const res = await criarNoticia({ ...noticiaBase, videoUrl: "https://exemplo.com/video" })
    expect(res).toEqual({ error: "Use um link do YouTube" })
    expect(m.noticia.create).not.toHaveBeenCalled()
  })
})

describe("editarNoticia", () => {
  it("atualiza notícia existente", async () => {
    await editarNoticia(1, noticiaBase)
    expect(m.noticia.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { ...noticiaBase, corpo: null, videoUrl: null, slug: "vitoria-na-copa" },
    })
  })

  it("não troca o slug quando o título muda (link compartilhado continua valendo)", async () => {
    await editarNoticia(1, { ...noticiaBase, titulo: "Título totalmente novo" })
    expect(m.noticia.update.mock.calls[0][0].data.slug).toBe("vitoria-na-copa")
  })

  it("notícia antiga sem slug ganha um na edição", async () => {
    m.noticia.findUnique.mockImplementation(async (arg: { where: { slug?: string } }) => (arg.where.slug ? null : { slug: null }))
    await editarNoticia(1, { ...noticiaBase, titulo: "Título novo" })
    expect(m.noticia.update.mock.calls[0][0].data.slug).toBe("titulo-novo")
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
