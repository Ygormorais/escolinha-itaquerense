import { describe, it, expect } from "vitest"
import { montarSeriesEvolucao } from "@/lib/evolucao"

const av = (periodo: string, t: number | null, f: number | null, c: number | null, freq: number | null) => ({
  periodo, notaTecnica: t, notaFisica: f, notaComportamento: c, frequencia: freq,
})

describe("montarSeriesEvolucao", () => {
  it("ordena por período (semestres lexicográficos)", () => {
    const s = montarSeriesEvolucao([av("2026-1S", 7, 6, 8, 90), av("2025-2S", 5, 5, 7, 80)])
    expect(s.map((p) => p.periodo)).toEqual(["2025-2S", "2026-1S"])
  })

  it("reescala frequência % para 0-10", () => {
    const s = montarSeriesEvolucao([av("2026-1S", 7, 6, 8, 85)])
    expect(s[0].frequencia).toBe(8.5)
  })

  it("mantém nota nula como null (gap no gráfico)", () => {
    const s = montarSeriesEvolucao([av("2026-1S", null, 6, 8, null)])
    expect(s[0].tecnica).toBeNull()
    expect(s[0].frequencia).toBeNull()
  })
})
