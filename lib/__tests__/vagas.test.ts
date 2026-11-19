import { describe, expect, it } from "vitest"
import { situacaoVagas } from "@/lib/vagas"

describe("situacaoVagas", () => {
  it("muitas vagas", () => {
    expect(situacaoVagas(20, 10)).toEqual({ nivel: "disponivel", restantes: 10, rotulo: "Vagas disponíveis" })
  })
  it("poucas vagas a partir de 3 restantes", () => {
    expect(situacaoVagas(20, 17)).toMatchObject({ nivel: "poucas", restantes: 3, rotulo: "Últimas 3 vagas" })
    expect(situacaoVagas(20, 19)).toMatchObject({ nivel: "poucas", rotulo: "Última vaga" })
    expect(situacaoVagas(20, 16).nivel).toBe("disponivel")
  })
  it("lotada quando ocupação alcança ou passa a capacidade", () => {
    expect(situacaoVagas(20, 20)).toEqual({ nivel: "lotada", restantes: 0, rotulo: "Turma lotada" })
    expect(situacaoVagas(20, 25).restantes).toBe(0)
  })
})
