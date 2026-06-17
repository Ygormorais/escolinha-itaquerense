import { describe, it, expect } from "vitest"
import { eventoAplicaATurma } from "../agenda"

describe("eventoAplicaATurma", () => {
  it('"Todas" aplica a qualquer turma', () => {
    expect(eventoAplicaATurma("Todas", "Sub-11")).toBe(true)
  })
  it("turma exata aplica", () => {
    expect(eventoAplicaATurma("Sub-11", "Sub-11")).toBe(true)
  })
  it("lista com a turma aplica (com espaços)", () => {
    expect(eventoAplicaATurma("Sub-9, Sub-11 , Sub-13", "Sub-11")).toBe(true)
  })
  it("lista sem a turma não aplica", () => {
    expect(eventoAplicaATurma("Sub-9, Sub-13", "Sub-11")).toBe(false)
  })
})
