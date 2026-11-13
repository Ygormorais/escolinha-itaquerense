import { describe, expect, it } from "vitest"
import { mapaFeriados } from "@/lib/feriados"
import { gerarTreinos, parseHorario } from "@/lib/treinos-agenda"

describe("parseHorario", () => {
  it("lê dias e hora", () => {
    expect(parseHorario("Ter/Qui 14h")).toEqual({ dias: [2, 4], hora: "14:00" })
    expect(parseHorario("Seg/Qua/Sex 16h")).toEqual({ dias: [1, 3, 5], hora: "16:00" })
    expect(parseHorario("Sáb 9h")).toEqual({ dias: [6], hora: "09:00" })
    expect(parseHorario("Seg/Qua 18h30")).toEqual({ dias: [1, 3], hora: "18:30" })
  })
  it("rejeita texto inválido", () => {
    expect(parseHorario("")).toBeNull()
    expect(parseHorario("a combinar")).toBeNull()
    expect(parseHorario("Xyz 10h")).toBeNull()
    expect(parseHorario("Seg 25h")).toBeNull()
  })
})

const slots = [
  { turma: "Sub-13", horario: "Ter/Qui 14h" },
  { turma: "Sub-11", horario: "Ter/Qui 14h" },
  { turma: "Sub-17", horario: "Seg/Qua/Sex 18h" },
  { turma: "Sub-7", horario: "a combinar" },
]
const semFeriados = new Map<string, string>()

describe("gerarTreinos", () => {
  it("gera uma ocorrência por dia da semana e agrupa turmas no mesmo horário", () => {
    // 02/11/2026 é segunda
    const r = gerarTreinos(slots, "2026-11-02", "2026-11-08", semFeriados, [])
    expect(r.map((t) => `${t.dia} ${t.hora}`)).toEqual([
      "2026-11-02 18:00",
      "2026-11-03 14:00",
      "2026-11-04 18:00",
      "2026-11-05 14:00",
      "2026-11-06 18:00",
    ])
    expect(r[1].turmas).toEqual(["Sub-11", "Sub-13"])
    expect(r[1].titulo).toBe("Treino Sub-11, Sub-13")
    expect(r.every((t) => !t.cancelado)).toBe(true)
  })

  it("cancela treino em feriado, com o nome do feriado", () => {
    const r = gerarTreinos(slots, "2026-11-16", "2026-11-22", mapaFeriados([2026]), [])
    const sexta = r.find((t) => t.dia === "2026-11-20")!
    expect(sexta.cancelado).toBe(true)
    expect(sexta.motivo).toBe("Feriado: Dia da Consciência Negra")
    expect(r.find((t) => t.dia === "2026-11-18")!.cancelado).toBe(false)
  })

  it("cancela treino em bloqueio da quadra (intervalo inclusivo)", () => {
    const b = [{ inicio: "2026-11-03", fim: "2026-11-04", motivo: "Reforma do piso" }]
    const r = gerarTreinos(slots, "2026-11-02", "2026-11-06", semFeriados, b)
    expect(r.filter((t) => t.cancelado).map((t) => t.dia)).toEqual(["2026-11-03", "2026-11-04"])
    expect(r.find((t) => t.dia === "2026-11-03")!.motivo).toBe("Quadra bloqueada: Reforma do piso")
  })

  it("feriado tem prioridade no motivo quando também há bloqueio", () => {
    const b = [{ inicio: "2026-11-20", fim: "2026-11-20", motivo: "Evento" }]
    const r = gerarTreinos(slots, "2026-11-20", "2026-11-20", mapaFeriados([2026]), b)
    expect(r[0].motivo).toMatch(/^Feriado/)
  })

  it("sem slots válidos não gera nada", () => {
    expect(gerarTreinos([{ turma: "Sub-7", horario: "x" }], "2026-11-01", "2026-11-30", semFeriados, [])).toEqual([])
  })

  it("atravessa virada de ano", () => {
    const r = gerarTreinos([{ turma: "Sub-9", horario: "Qui 10h" }], "2026-12-28", "2027-01-08", semFeriados, [])
    expect(r.map((t) => t.dia)).toEqual(["2026-12-31", "2027-01-07"])
  })
})
