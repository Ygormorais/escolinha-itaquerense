import { describe, expect, it } from "vitest"
import { scrollLeftParaCentralizar } from "@/components/landing/centralizar-aba"

describe("scrollLeftParaCentralizar", () => {
  const faixa = { left: 100, width: 400, scrollLeft: 0 }

  it("coloca a aba no centro da faixa", () => {
    // aba de 80px que começa 500px à direita do início da faixa: centro em 540, metade da faixa em 200
    expect(scrollLeftParaCentralizar(faixa, { left: 600, width: 80 })).toBe(340)
  })

  it("soma o que a faixa já rolou", () => {
    expect(scrollLeftParaCentralizar({ ...faixa, scrollLeft: 120 }, { left: 300, width: 100 })).toBe(120 + 200 - 150)
  })

  it("não passa de zero quando a aba já está perto do começo", () => {
    expect(scrollLeftParaCentralizar(faixa, { left: 110, width: 60 })).toBe(0)
  })

  it("aba já centralizada não desloca nada", () => {
    expect(scrollLeftParaCentralizar({ ...faixa, scrollLeft: 50 }, { left: 250, width: 100 })).toBe(50)
  })
})
