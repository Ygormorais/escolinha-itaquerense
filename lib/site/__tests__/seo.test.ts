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

  it("é indexável", () => {
    expect(meta.robots).toEqual({ index: true, follow: true })
  })
})
