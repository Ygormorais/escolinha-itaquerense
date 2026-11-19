import { describe, expect, it } from "vitest"
import {
  dataBrParaIso,
  idadeEmAnos,
  primeiroCampoComErro,
  telefoneValido,
  validarPreMatricula,
  type DadosPreMatricula,
} from "@/lib/site/matricula-validacao"

const HOJE = new Date(2026, 5, 15) // 15/06/2026

const valido: DadosPreMatricula = {
  nomeAluno: "Ana Souza",
  dataNascimento: "2015-06-15",
  turma: "Sub-11",
  nomeResponsavel: "Maria Souza",
  telefone: "(11) 99999-8888",
  email: "maria@email.com",
  consentimento: true,
}

describe("dataBrParaIso", () => {
  it("converte datas reais e recusa as impossíveis", () => {
    expect(dataBrParaIso("15/06/2015")).toBe("2015-06-15")
    expect(dataBrParaIso("31/02/2015")).toBeNull()
    expect(dataBrParaIso("15062015")).toBeNull()
  })
})

describe("idadeEmAnos", () => {
  it("conta só anos completos", () => {
    expect(idadeEmAnos("2015-06-15", HOJE)).toBe(11)
    expect(idadeEmAnos("2015-06-16", HOJE)).toBe(10)
    expect(idadeEmAnos("2015-05-01", HOJE)).toBe(11)
  })
})

describe("telefoneValido", () => {
  it.each(["(11) 99999-8888", "1133334444", "5511999998888"])("%s é válido", (t) => expect(telefoneValido(t)).toBe(true))
  it.each(["abc", "123", "(11) 9999", "999999999999999"])("%s é inválido", (t) => expect(telefoneValido(t)).toBe(false))
})

describe("validarPreMatricula", () => {
  it("aceita dados corretos", () => {
    expect(validarPreMatricula(valido, HOJE)).toEqual({})
  })

  it("exige os campos obrigatórios", () => {
    const erros = validarPreMatricula(
      { ...valido, nomeAluno: " ", turma: "", nomeResponsavel: "", telefone: "", dataNascimento: "", consentimento: false },
      HOJE,
    )
    expect(Object.keys(erros).sort()).toEqual(["aluno", "consentimento", "dataNasc", "responsavel", "telefone", "turma"])
  })

  it("recusa telefone com texto qualquer (antes o servidor só exigia 1 caractere)", () => {
    expect(validarPreMatricula({ ...valido, telefone: "me liga" }, HOJE).telefone).toMatch(/inválido/)
  })

  it("limita a idade a 3-20 anos pela data real", () => {
    expect(validarPreMatricula({ ...valido, dataNascimento: "2023-06-16" }, HOJE).dataNasc).toMatch(/3 a 20/)
    expect(validarPreMatricula({ ...valido, dataNascimento: "2023-06-15" }, HOJE).dataNasc).toBeUndefined()
    expect(validarPreMatricula({ ...valido, dataNascimento: "2005-06-15" }, HOJE).dataNasc).toMatch(/3 a 20/)
    expect(validarPreMatricula({ ...valido, dataNascimento: "2005-06-16" }, HOJE).dataNasc).toBeUndefined()
  })

  it("recusa data inexistente e futura", () => {
    expect(validarPreMatricula({ ...valido, dataNascimento: "2015-02-31" }, HOJE).dataNasc).toMatch(/inválida/)
    expect(validarPreMatricula({ ...valido, dataNascimento: "2030-01-01" }, HOJE).dataNasc).toMatch(/3 a 20/)
  })

  it("e-mail é opcional, mas se vier precisa ser válido", () => {
    expect(validarPreMatricula({ ...valido, email: "" }, HOJE).email).toBeUndefined()
    expect(validarPreMatricula({ ...valido, email: "sem-arroba" }, HOJE).email).toBe("E-mail inválido.")
  })
})

describe("primeiroCampoComErro", () => {
  it("segue a ordem do formulário", () => {
    expect(primeiroCampoComErro({ telefone: "x", aluno: "y" })).toBe("aluno")
    expect(primeiroCampoComErro({})).toBeNull()
  })
})
