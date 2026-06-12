import { describe, it, expect } from "vitest"
import { extrairCategorias, categoriaIdeal, calcularViradas } from "@/lib/categorias"

describe("extrairCategorias", () => {
  it("extrai e ordena Sub-N únicos, ignorando turmas fora do padrão", () => {
    expect(extrairCategorias(["Sub-11", "Sub-7", "Sub-11", "Adulto", "Sub-9"])).toEqual([7, 9, 11])
  })
})

describe("categoriaIdeal", () => {
  const cats = [7, 9, 11, 13, 15, 17]
  it("usa a idade que completa no ano de referência", () => {
    // nasceu 2017 → completa 9 em 2026 → Sub-9
    expect(categoriaIdeal(new Date("2017-08-20T12:00:00"), 2026, cats)).toBe("Sub-9")
  })
  it("idade exatamente no limite fica na categoria", () => {
    expect(categoriaIdeal(new Date("2015-01-01T12:00:00"), 2026, cats)).toBe("Sub-11") // completa 11
  })
  it("acima da maior categoria retorna null", () => {
    expect(categoriaIdeal(new Date("2008-06-01T12:00:00"), 2026, cats)).toBeNull() // completa 18
  })
})

describe("calcularViradas", () => {
  it("lista apenas alunos cuja turma difere da ideal", () => {
    const alunos = [
      { id: 1, nome: "Fica", dataNascimento: new Date("2017-05-01T12:00:00"), turma: "Sub-9" },
      { id: 2, nome: "Sobe", dataNascimento: new Date("2016-05-01T12:00:00"), turma: "Sub-9" }, // completa 10 → Sub-11
    ]
    const viradas = calcularViradas(alunos, 2026, [7, 9, 11])
    expect(viradas).toHaveLength(1)
    expect(viradas[0]).toMatchObject({ id: 2, turmaAtual: "Sub-9", turmaProposta: "Sub-11", acimaDoMaximo: false })
  })

  it("marca acimaDoMaximo quando não há categoria que comporte", () => {
    const alunos = [{ id: 3, nome: "Velho", dataNascimento: new Date("2010-01-01T12:00:00"), turma: "Sub-11" }]
    const viradas = calcularViradas(alunos, 2026, [7, 9, 11])
    expect(viradas[0]).toMatchObject({ turmaProposta: null, acimaDoMaximo: true })
  })
})
