import { describe, it, expect } from "vitest"
import { calcularMedia } from "../ficha-avaliacao"

describe("calcularMedia", () => {
  it("média de 3 notas inteiras", () => {
    expect(calcularMedia(7, 8, 9)).toBe(8.0)
  })

  it("média com 1 nota nula (ignora nulos)", () => {
    expect(calcularMedia(8, null, 6)).toBe(7.0)
  })

  it("todas nulas retorna null", () => {
    expect(calcularMedia(null, null, null)).toBeNull()
  })

  it("arredonda para 1 casa decimal", () => {
    // (7 + 8 + 6) / 3 = 7.0 exato; mas ex: (7 + 8 + 5) / 3 = 6.666... → 6.7
    expect(calcularMedia(7, 8, 5)).toBe(6.7)
  })
})
