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
  })
})
