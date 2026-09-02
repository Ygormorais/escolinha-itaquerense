import { describe, expect, it } from "vitest"
import { gerarInsightsDesenvolvimento, inicioDaSemana, insightKeySemanal, type AtletaDesenvolvimento } from "@/lib/desenvolvimento"

const now = new Date("2026-08-26T12:00:00-03:00")

function athlete(overrides: Partial<AtletaDesenvolvimento> = {}): AtletaDesenvolvimento {
  return {
    id: 12,
    nome: "Atleta Teste",
    turma: "Sub-13",
    dataMatricula: new Date("2025-01-10T12:00:00-03:00"),
    frequencias: [],
    avaliacoes: [],
    datasConvocacoes: [],
    ...overrides,
  }
}

function attendance(dates: string[], present: number) {
  return dates.map((data, index) => ({
    data: new Date(`${data}T12:00:00-03:00`),
    presenca: index < present ? "Presente" : "Ausente",
  }))
}

describe("gerarInsightsDesenvolvimento", () => {
  it("detecta queda apenas quando as duas janelas têm amostra mínima", () => {
    const current = attendance(["2026-08-02", "2026-08-09", "2026-08-16", "2026-08-23"], 2)
    const previous = attendance(["2026-07-02", "2026-07-09", "2026-07-16", "2026-07-23"], 4)
    const insights = gerarInsightsDesenvolvimento(athlete({ frequencias: [...current, ...previous] }), { now })

    expect(insights.find((item) => item.tipo === "frequencia_em_queda")?.evidencias).toEqual([
      "50% de presença nos últimos 30 dias (4 registros)",
      "100% nos 30 dias anteriores (4 registros)",
    ])
    expect(insights.some((item) => item.tipo === "baixa_frequencia")).toBe(false)
  })

  it("não alerta baixa frequência com menos de três registros", () => {
    const insights = gerarInsightsDesenvolvimento(athlete({
      frequencias: attendance(["2026-08-10", "2026-08-20"], 0),
      dataMatricula: new Date("2026-08-01T12:00:00-03:00"),
    }), { now })

    expect(insights).toHaveLength(0)
  })

  it("sinaliza avaliação atrasada somente após a carência inicial", () => {
    const veteran = gerarInsightsDesenvolvimento(athlete(), { now })
    const newcomer = gerarInsightsDesenvolvimento(athlete({ dataMatricula: new Date("2026-07-01T12:00:00-03:00") }), { now })

    expect(veteran.some((item) => item.tipo === "avaliacao_atrasada")).toBe(true)
    expect(newcomer.some((item) => item.tipo === "avaliacao_atrasada")).toBe(false)
  })

  it("aponta oportunidade apenas quando houve jogos e boa presença", () => {
    const frequencias = attendance(["2026-06-10", "2026-06-24", "2026-07-10", "2026-07-24", "2026-08-10"], 5)
    const withMatches = gerarInsightsDesenvolvimento(athlete({ frequencias }), { now, recentMatches: 3 })
    const withoutMatches = gerarInsightsDesenvolvimento(athlete({ frequencias }), { now, recentMatches: 0 })

    expect(withMatches.some((item) => item.tipo === "poucas_oportunidades")).toBe(true)
    expect(withoutMatches.some((item) => item.tipo === "poucas_oportunidades")).toBe(false)
  })

  it("reconhece evolução nas duas últimas avaliações", () => {
    const insights = gerarInsightsDesenvolvimento(athlete({
      avaliacoes: [
        { periodo: "2026-2S", notaTecnica: 8, notaFisica: 8, notaComportamento: 9, createdAt: new Date("2026-08-01") },
        { periodo: "2026-1S", notaTecnica: 7, notaFisica: 7, notaComportamento: 7, createdAt: new Date("2026-02-01") },
      ],
    }), { now })

    expect(insights.find((item) => item.tipo === "evolucao_positiva")?.positivo).toBe(true)
  })
})

describe("chave semanal", () => {
  it("usa a segunda-feira local como início do ciclo", () => {
    expect(inicioDaSemana(now)).toBe("2026-08-24")
    expect(insightKeySemanal({ id: "12:baixa_frequencia" }, now)).toBe("12:baixa_frequencia:2026-08-24")
  })
})
