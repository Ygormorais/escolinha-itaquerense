import { describe, it, expect } from "vitest"

describe("matricula validation", () => {
  function validatePreMatricula(data: {
    nomeAluno: string
    nomeResponsavel: string
    telefone: string
    email?: string
  }): string | null {
    if (!data.nomeAluno?.trim()) return "Nome do aluno é obrigatório"
    if (!data.nomeResponsavel?.trim()) return "Nome do responsável é obrigatório"
    if (!data.telefone?.trim()) return "Telefone é obrigatório"
    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) return "Email inválido"
    return null
  }

  it("accepts valid data", () => {
    const error = validatePreMatricula({
      nomeAluno: "João Silva",
      nomeResponsavel: "Maria Silva",
      telefone: "(11) 99999-8888",
      email: "maria@email.com",
    })
    expect(error).toBeNull()
  })

  it("rejects empty aluno name", () => {
    const error = validatePreMatricula({
      nomeAluno: "",
      nomeResponsavel: "Maria",
      telefone: "(11) 99999-8888",
    })
    expect(error).toBe("Nome do aluno é obrigatório")
  })

  it("rejects empty responsavel name", () => {
    const error = validatePreMatricula({
      nomeAluno: "João",
      nomeResponsavel: "",
      telefone: "(11) 99999-8888",
    })
    expect(error).toBe("Nome do responsável é obrigatório")
  })

  it("rejects empty telefone", () => {
    const error = validatePreMatricula({
      nomeAluno: "João",
      nomeResponsavel: "Maria",
      telefone: "",
    })
    expect(error).toBe("Telefone é obrigatório")
  })

  it("rejects invalid email", () => {
    const error = validatePreMatricula({
      nomeAluno: "João",
      nomeResponsavel: "Maria",
      telefone: "(11) 99999-8888",
      email: "invalido",
    })
    expect(error).toBe("Email inválido")
  })

  it("accepts data without email", () => {
    const error = validatePreMatricula({
      nomeAluno: "João",
      nomeResponsavel: "Maria",
      telefone: "(11) 99999-8888",
    })
    expect(error).toBeNull()
  })
})
