import { describe, it, expect } from "vitest"
import { MATERIAS, MATERIAS_ABAS, materiasPorAba } from "@/lib/landing/materias"

describe("materias institucionais", () => {
  it("tem abas principais", () => {
    const ids = MATERIAS_ABAS.map((a) => a.id)
    expect(ids).toEqual([
      "destaques",
      "mundial",
      "conquistas",
      "participacoes",
      "clube",
    ])
  })

  it("destaques so traz cards marcados", () => {
    const d = materiasPorAba("destaques")
    expect(d.length).toBeGreaterThanOrEqual(5)
    expect(d.every((m) => m.destaque)).toBe(true)
  })

  it("mundial inclui titulo de 2012", () => {
    const m = materiasPorAba("mundial")
    expect(m.some((c) => /Mundial|Hyères|França|2012/i.test(c.titulo + c.resumo))).toBe(true)
  })

  it("conquistas inclui paulista", () => {
    const m = materiasPorAba("conquistas")
    expect(m.some((c) => /Paulista|campeão|vice/i.test(c.titulo + c.resumo))).toBe(true)
  })

  it("clube inclui centenario e livro", () => {
    const m = materiasPorAba("clube")
    expect(m.length).toBeGreaterThanOrEqual(8)
    expect(m.some((c) => /100 anos|103|1922|livro/i.test(c.titulo + c.resumo))).toBe(true)
  })

  it("todas as materias tem titulo e resumo", () => {
    for (const m of MATERIAS) {
      expect(m.titulo.length).toBeGreaterThan(5)
      expect(m.resumo.length).toBeGreaterThan(20)
    }
  })

  it("materias com link sao externas (imprensa) e nunca /resultados", () => {
    const comLink = MATERIAS.filter((m) => m.href)
    expect(comLink.length).toBeGreaterThan(10)
    for (const m of comLink) {
      expect(m.href ?? "").not.toMatch(/^\/resultados/)
      expect(m.externo).toBe(true)
      expect(m.href).toMatch(/^https?:\/\//)
    }
  })
})
