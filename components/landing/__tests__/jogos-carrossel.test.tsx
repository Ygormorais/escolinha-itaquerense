import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { JogosCarrossel } from "@/components/landing/jogos-carrossel"
import type { CategoriaJogos } from "@/lib/landing/jogos"

const categorias: CategoriaJogos[] = [
  {
    categoria: "Sub-9 A3",
    jogos: [
      { adversario: "Vila Real", local: "Casa", data: new Date("2026-04-11T12:00:00"), placar: "2 × 1", realizado: true, resultado: "Vitoria", sumulaUrl: "http://x/sumula" },
      { adversario: "União EC", local: "Fora", data: new Date("2026-04-18T12:00:00"), placar: null, realizado: false, resultado: null, sumulaUrl: null },
    ],
  },
  { categoria: "Sub-11", jogos: [{ adversario: "Atlético", local: "Casa", data: new Date("2026-05-01T12:00:00"), placar: null, realizado: false, resultado: null, sumulaUrl: null }] },
]

describe("JogosCarrossel", () => {
  it("renderiza uma aba por categoria", () => {
    const html = renderToStaticMarkup(<JogosCarrossel categorias={categorias} />)
    expect(html).toContain("Sub-9 A3")
    expect(html).toContain("Sub-11")
  })
  it("mostra placar de jogo realizado e VS de jogo futuro (aba inicial)", () => {
    const html = renderToStaticMarkup(<JogosCarrossel categorias={categorias} />)
    expect(html).toContain("2 × 1")
    expect(html).toContain("VS")
    expect(html).toContain("Vila Real")
  })
  it("inclui link de súmula quando houver", () => {
    const html = renderToStaticMarkup(<JogosCarrossel categorias={categorias} />)
    expect(html).toContain('href="http://x/sumula"')
  })
  it("mostra estado vazio quando não há categorias (não some sem dados FPFS)", () => {
    const html = renderToStaticMarkup(<JogosCarrossel categorias={[]} />)
    expect(html).toContain("jc-empty")
    expect(html).toContain("aparecerão aqui em breve")
  })
})
