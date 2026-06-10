import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { RadarEvolutionChart, type AvaliacaoSnapshot } from "@/components/responsavel/radar-evolution-chart"

const snapshots: AvaliacaoSnapshot[] = [
  { label: "1S/2026", data: new Date("2026-01-01"), notas: { tecnica: 7, fisico: 8, comportamento: 9 } },
  { label: "2S/2026", data: new Date("2026-07-01"), notas: { tecnica: 8, fisico: 9, comportamento: 9 } },
]

describe("RadarEvolutionChart", () => {
  it("renderiza sem erros com multiplos snapshots", () => {
    expect(() => renderToStaticMarkup(<RadarEvolutionChart snapshots={snapshots} />)).not.toThrow()
  })

  it("renderiza EmptyState quando sem snapshots", () => {
    const html = renderToStaticMarkup(<RadarEvolutionChart snapshots={[]} />)
    expect(html).toContain("Avaliações ainda não")
  })

  it("nao renderiza input range quando ha apenas 1 snapshot", () => {
    const html = renderToStaticMarkup(<RadarEvolutionChart snapshots={[snapshots[0]]} />)
    expect(html).not.toContain('type="range"')
  })
})
