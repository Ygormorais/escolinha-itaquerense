import { describe, it, expect } from "vitest"
import { aniversariantesDoMes, ehAniversarioNoDia } from "@/lib/aniversariantes"

const aluno = (nome: string, nascimento: string) => ({
  id: 1, nome, dataNascimento: new Date(nascimento + "T12:00:00"),
})

describe("aniversariantesDoMes", () => {
  it("inclui só aniversários do mês de referência, ordenados por dia", () => {
    const ref = new Date("2026-06-15T12:00:00")
    const lista = aniversariantesDoMes(
      [aluno("Junho 20", "2015-06-20"), aluno("Maio", "2016-05-10"), aluno("Junho 03", "2017-06-03")],
      ref
    )
    expect(lista.map((a) => a.nome)).toEqual(["Junho 03", "Junho 20"])
  })

  it("calcula a idade que completa no aniversário deste ano", () => {
    const ref = new Date("2026-06-15T12:00:00")
    const [a] = aniversariantesDoMes([aluno("Kid", "2015-06-20")], ref)
    expect(a.idadeQueCompleta).toBe(11)
    expect(a.dia).toBe(20)
  })

  it("marca quem faz aniversário hoje", () => {
    const ref = new Date("2026-06-15T12:00:00")
    const [a] = aniversariantesDoMes([aluno("Hoje", "2014-06-15")], ref)
    expect(a.ehHoje).toBe(true)
  })
})

describe("ehAniversarioNoDia", () => {
  it("compara dia e mês ignorando ano e hora", () => {
    expect(ehAniversarioNoDia(new Date("2015-06-20T03:00:00"), new Date("2026-06-20T23:00:00"))).toBe(true)
    expect(ehAniversarioNoDia(new Date("2015-06-20T03:00:00"), new Date("2026-06-21T01:00:00"))).toBe(false)
  })
})
