import { describe, it, expect } from "vitest"
import { validarEscalacao } from "../escalacao/validacao"
import { corDaTurma } from "../escalacao/cores"
import { POSICOES, POSICOES_QUADRA, LABEL_POSICAO } from "../escalacao/posicoes"

describe("validarEscalacao", () => {
  it("aceita escalação válida com posições únicas", () => {
    const result = validarEscalacao([
      { alunoId: 1, posicao: "GOLEIRO" },
      { alunoId: 2, posicao: "FIXO" },
      { alunoId: 3, posicao: "BANCO" },
    ])
    expect(result).toEqual({ ok: true })
  })

  it("rejeita posição inválida", () => {
    const result = validarEscalacao([{ alunoId: 1, posicao: "ATACANTE" }])
    expect(result).toMatchObject({ ok: false, erro: expect.stringContaining("ATACANTE") })
  })

  it("rejeita aluno duplicado", () => {
    const result = validarEscalacao([
      { alunoId: 1, posicao: "GOLEIRO" },
      { alunoId: 1, posicao: "BANCO" },
    ])
    expect(result).toMatchObject({ ok: false, erro: expect.stringContaining("mais de uma vez") })
  })

  it("rejeita posição de quadra duplicada", () => {
    const result = validarEscalacao([
      { alunoId: 1, posicao: "GOLEIRO" },
      { alunoId: 2, posicao: "GOLEIRO" },
    ])
    expect(result).toMatchObject({ ok: false, erro: expect.stringContaining("GOLEIRO") })
  })

  it("permite múltiplos jogadores no BANCO (posição não-quadra)", () => {
    const result = validarEscalacao([
      { alunoId: 1, posicao: "BANCO" },
      { alunoId: 2, posicao: "BANCO" },
    ])
    expect(result).toEqual({ ok: true })
  })

  it("aceita escalação vazia", () => {
    expect(validarEscalacao([])).toEqual({ ok: true })
  })
})

describe("corDaTurma", () => {
  it("retorna classe para turma conhecida", () => {
    expect(corDaTurma("Sub-7")).toContain("bg-info")
    expect(corDaTurma("Sub-13")).toContain("bg-brand")
  })

  it("retorna fallback para turma desconhecida", () => {
    expect(corDaTurma("Sub-99")).toBe("bg-muted text-muted-foreground")
  })
})

describe("posicoes", () => {
  it("BANCO não é posição de quadra", () => {
    expect(POSICOES_QUADRA).not.toContain("BANCO")
    expect(POSICOES).toContain("BANCO")
  })

  it("todas as posições de quadra têm label", () => {
    for (const p of POSICOES) {
      expect(LABEL_POSICAO[p]).toBeTruthy()
    }
  })
})
