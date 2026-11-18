import { describe, expect, it } from "vitest"
import { metadataPublica } from "@/lib/site/seo"

describe("metadataPublica", () => {
  const meta = metadataPublica({
    title: "Turmas e horários",
    description: "Descrição própria da página.",
    path: "/horarios",
  })

  it("não repete o sufixo do clube no título (o template do layout completa)", () => {
    expect(meta.title).toBe("Turmas e horários")
    expect(String(meta.title)).not.toMatch(/Itaquerense/)
  })

  it("define canonical e og:url da própria página", () => {
    expect(meta.alternates?.canonical).toBe("/horarios")
    expect(meta.openGraph?.url).toBe("/horarios")
  })

  it("mantém a descrição única no Open Graph e no Twitter", () => {
    expect(meta.description).toBe("Descrição própria da página.")
    expect(meta.openGraph?.description).toBe("Descrição própria da página.")
    expect(meta.twitter?.description).toBe("Descrição própria da página.")
  })

  it("repete a imagem 1200x630 de prévia, que o openGraph da página substituiria", () => {
    expect(meta.openGraph?.images).toEqual([expect.objectContaining({ url: "/opengraph-image", width: 1200, height: 630 })])
    expect(meta.twitter?.images).toEqual(["/twitter-image"])
  })

  it("é indexável", () => {
    expect(meta.robots).toEqual({ index: true, follow: true })
  })
})
