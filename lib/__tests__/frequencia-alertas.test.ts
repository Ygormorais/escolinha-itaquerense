import { describe, it, expect } from "vitest"
import { estaEmQueda, filtrarEmQueda, LIMITE_QUEDA, MIN_REGISTROS } from "@/lib/frequencia-alertas"

describe("estaEmQueda", () => {
  it("em queda: abaixo de 70% com registros suficientes", () => {
    expect(estaEmQueda({ pct: 60, total: 5 })).toBe(true)
  })
  it("NÃO em queda: abaixo de 70% mas poucos registros", () => {
    expect(estaEmQueda({ pct: 50, total: 3 })).toBe(false)
  })
  it("NÃO em queda: exatamente no limite 70% (usa <)", () => {
    expect(estaEmQueda({ pct: 70, total: 10 })).toBe(false)
  })
  it("NÃO em queda: acima do limite", () => {
    expect(estaEmQueda({ pct: 85, total: 10 })).toBe(false)
  })
  it("constantes exportadas com os valores corretos", () => {
    expect(LIMITE_QUEDA).toBe(70)
    expect(MIN_REGISTROS).toBe(4)
  })
})

describe("filtrarEmQueda", () => {
  it("retorna apenas os em queda, preservando o tipo", () => {
    const alunos = [
      { id: 1, nome: "A", pct: 50, total: 5 },
      { id: 2, nome: "B", pct: 90, total: 5 },
      { id: 3, nome: "C", pct: 40, total: 2 },
    ]
    const r = filtrarEmQueda(alunos)
    expect(r.map((a) => a.id)).toEqual([1])
  })
})
