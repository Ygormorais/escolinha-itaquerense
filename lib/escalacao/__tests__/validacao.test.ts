import { describe, it, expect } from "vitest"
import { validarEscalacao } from "@/lib/escalacao/validacao"

describe("validarEscalacao", () => {
  it("aceita uma escalação válida (5 quadra + 2 banco)", () => {
    const r = validarEscalacao([
      { alunoId: 1, posicao: "GOLEIRO" },
      { alunoId: 2, posicao: "FIXO" },
      { alunoId: 3, posicao: "ALA_ESQ" },
      { alunoId: 4, posicao: "ALA_DIR" },
      { alunoId: 5, posicao: "PIVO" },
      { alunoId: 6, posicao: "BANCO" },
      { alunoId: 7, posicao: "BANCO" },
    ])
    expect(r).toEqual({ ok: true })
  })

  it("rejeita dois jogadores no mesmo slot de quadra", () => {
    const r = validarEscalacao([
      { alunoId: 1, posicao: "PIVO" },
      { alunoId: 2, posicao: "PIVO" },
    ])
    expect(r.ok).toBe(false)
  })

  it("rejeita aluno duplicado", () => {
    const r = validarEscalacao([
      { alunoId: 1, posicao: "FIXO" },
      { alunoId: 1, posicao: "BANCO" },
    ])
    expect(r.ok).toBe(false)
  })

  it("rejeita posição inválida", () => {
    const r = validarEscalacao([{ alunoId: 1, posicao: "ATACANTE" }])
    expect(r.ok).toBe(false)
  })

  it("aceita vários no banco", () => {
    const r = validarEscalacao([
      { alunoId: 1, posicao: "BANCO" },
      { alunoId: 2, posicao: "BANCO" },
      { alunoId: 3, posicao: "BANCO" },
    ])
    expect(r).toEqual({ ok: true })
  })

  it("aceita escalação vazia", () => {
    expect(validarEscalacao([])).toEqual({ ok: true })
  })
})
