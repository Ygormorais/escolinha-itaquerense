import { describe, it, expect } from "vitest"
import { corDaTurma } from "@/lib/escalacao/cores"

describe("corDaTurma", () => {
  it("retorna classe específica para turma conhecida", () => {
    expect(corDaTurma("Sub-11")).toBe("bg-warning-50 text-warning-600")
  })

  it("é estável (mesma turma → mesma classe)", () => {
    expect(corDaTurma("Sub-9")).toBe(corDaTurma("Sub-9"))
  })

  it("usa fallback para turma desconhecida", () => {
    expect(corDaTurma("Sub-99")).toBe("bg-muted text-muted-foreground")
  })
})
