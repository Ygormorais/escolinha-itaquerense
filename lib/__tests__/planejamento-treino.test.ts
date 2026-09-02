import { describe, it, expect } from "vitest"
import { prepararPlanoTreino, type PreferenciasTreino } from "@/lib/planejamento-treino"

const base: PreferenciasTreino = { turma: "Sub-11", faixa: "9–11", duracao: 45, objetivo: "passes", bolas: true, cones: false }
describe("catálogo local de treino", () => {
  it.each([30, 45, 60] as const)("totaliza %i minutos sem inventar tempo extra", (duracao) => {
    const r = prepararPlanoTreino({ ...base, duracao })
    expect(r.plano?.blocos.reduce((s, b) => s + b.minutos, 0)).toBe(duracao)
    expect(r.plano?.texto).toContain("inclui pausas e transições")
    expect(r.plano?.texto).toContain("validação da comissão")
  })
  it.each(["passes", "conducao", "cooperacao"] as const)("gera proposta determinística para %s", (objetivo) => {
    const p = { ...base, objetivo }
    expect(prepararPlanoTreino(p)).toEqual(prepararPlanoTreino(p))
    expect(prepararPlanoTreino(p).plano?.texto).toContain("sem ranking")
  })
  it("não usa cones quando não estão disponíveis", () => {
    expect(prepararPlanoTreino(base).plano?.texto).not.toContain("com cones")
    expect(prepararPlanoTreino({ ...base, cones: true }).plano?.texto).toContain("com cones")
  })
  it("não inventa atividade sem material obrigatório", () => {
    expect(prepararPlanoTreino({ ...base, bolas: false })).toHaveProperty("error")
  })
  it("adapta instrução por faixa sem inferir habilidade individual", () => {
    expect(prepararPlanoTreino({ ...base, faixa: "6–8" }).plano?.texto).toContain("linguagem lúdica")
    expect(prepararPlanoTreino({ ...base, faixa: "16–17" }).plano?.texto).toContain("experiência observada")
  })
  it.each([{ turma: " " }, { duracao: 0 }, { faixa: "adultos" }, { objetivo: "lesao" }])("recusa opções inválidas %j", (p) => {
    expect(prepararPlanoTreino({ ...base, ...p } as PreferenciasTreino)).toHaveProperty("error")
  })
})
