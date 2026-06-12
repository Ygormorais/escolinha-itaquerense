import { describe, it, expect } from "vitest"
import { podeResponder, quemNotificar, resumoConfirmacoes } from "@/lib/convocacao"

describe("podeResponder", () => {
  it("permite até o horário da partida", () => {
    expect(podeResponder(new Date("2026-06-20T15:00:00"), new Date("2026-06-19T10:00:00"))).toBe(true)
    expect(podeResponder(new Date("2026-06-20T15:00:00"), new Date("2026-06-20T16:00:00"))).toBe(false)
  })
})

describe("quemNotificar", () => {
  const esc = (alunoId: number, responsavelId: number | null, confirmacao: string | null) => ({
    alunoId, confirmacao, aluno: { responsavelId },
  })
  it("primeira convocação notifica todos com responsável vinculado, sem duplicar", () => {
    const ids = quemNotificar([esc(1, 10, null), esc(2, 10, null), esc(3, null, null)], false)
    expect(ids).toEqual([10])
  })
  it("re-convocação notifica só responsáveis de quem ainda não respondeu", () => {
    const ids = quemNotificar([esc(1, 10, "confirmado"), esc(2, 20, null)], true)
    expect(ids).toEqual([20])
  })
})

describe("resumoConfirmacoes", () => {
  it("conta confirmados, ausentes e sem resposta", () => {
    const r = resumoConfirmacoes([
      { confirmacao: "confirmado" }, { confirmacao: "ausente" }, { confirmacao: null }, { confirmacao: null },
    ])
    expect(r).toEqual({ confirmados: 1, ausentes: 1, semResposta: 2 })
  })
})
