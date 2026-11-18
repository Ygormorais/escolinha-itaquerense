import { beforeEach, describe, expect, it, vi } from "vitest"

const findFirst = vi.fn()
vi.mock("@/lib/db", () => ({ db: { noticia: { findFirst: (...a: unknown[]) => findFirst(...a), findMany: vi.fn() } } }))
vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }))

import { getNoticiaPublicada } from "@/lib/noticias/dados"

beforeEach(() => findFirst.mockReset())

describe("getNoticiaPublicada", () => {
  it("só consulta notícias publicadas (rascunho nunca vaza)", async () => {
    findFirst.mockResolvedValue(null)
    expect(await getNoticiaPublicada("rascunho-secreto")).toBeNull()
    expect(findFirst.mock.calls[0][0].where).toEqual({ slug: "rascunho-secreto", publicado: true })
  })

  it("slug com formato inválido nem chega ao banco", async () => {
    expect(await getNoticiaPublicada("../../etc/passwd")).toBeNull()
    expect(await getNoticiaPublicada("")).toBeNull()
    expect(findFirst).not.toHaveBeenCalled()
  })

  it("devolve a notícia publicada", async () => {
    findFirst.mockResolvedValue({ id: 1, slug: "a", titulo: "A" })
    expect(await getNoticiaPublicada("a")).toMatchObject({ id: 1 })
  })
})
