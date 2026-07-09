import { describe, it, expect } from "vitest"
import { sobre, galeria, depoimentos, temSobre, temGaleria, temDepoimentos } from "@/lib/landing/conteudo"

describe("conteúdo da landing (config-driven com guarda)", () => {
  it("guardas refletem o conteúdo atual da config", () => {
    expect(temSobre()).toBe(sobre !== null && sobre.paragrafos.length > 0)
    expect(temGaleria()).toBe(galeria.length > 0)
    expect(temDepoimentos()).toBe(depoimentos.length > 0)
  })

  it("sobre está preenchido com conteúdo real", () => {
    expect(sobre).not.toBeNull()
    expect(sobre!.paragrafos.length).toBeGreaterThan(0)
    expect(sobre!.titulo.length).toBeGreaterThan(5)
    expect(sobre!.paragrafos.join(" ").toLowerCase()).toMatch(/elite|itaquerense/)
  })

  it("galeria tem fotos locais com paths em /landing", () => {
    expect(galeria.length).toBeGreaterThan(0)
    for (const f of galeria) {
      expect(f.src.startsWith("/landing/")).toBe(true)
      expect(f.alt.length).toBeGreaterThan(5)
    }
  })
})
