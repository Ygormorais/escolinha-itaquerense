import { describe, it, expect, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import type { PartidaLinha } from "@/lib/site/partidas"

function linha(id: number, data: string, extra: Partial<PartidaLinha> = {}): PartidaLinha {
  return {
    id,
    data,
    categoria: "Sub-13",
    competicao: "Federação Paulista de Futsal",
    local: "Casa",
    nosCasa: true,
    casa: "Itaquerense",
    fora: "Vila Real",
    placar: [3, 1],
    resultado: "Vitoria",
    escudosAdversario: [],
    href: "https://fpfs.example/sumula/1",
    externo: true,
    temSumula: true,
    ...extra,
  }
}

const partidas = vi.hoisted(() => ({ lista: [] as PartidaLinha[] }))

vi.mock("@/lib/site/partidas-dados", () => ({
  getPartidasPublicasCached: vi.fn(async () => partidas.lista),
}))
vi.mock("@/lib/site/classificacao", () => ({
  getClassificacoesPorCategoria: vi.fn(async () => new Map()),
}))
vi.mock("@/lib/site/anuncios-dados", () => ({
  getAnuncio: vi.fn(async () => null),
}))
vi.mock("@/components/site/site-chrome", () => ({
  SiteTopo: () => null,
  SiteRodape: () => null,
}))
vi.mock("next/image", () => ({
  default: (p: { alt: string }) => `<img alt="${p.alt}" />`,
}))

import PartidasPage from "@/app/partidas/page"

async function render(params: Record<string, string> = {}) {
  return renderToStaticMarkup(await PartidasPage({ searchParams: Promise.resolve(params) }))
}

describe("PartidasPage", () => {
  it("mostra estado vazio sem partidas", async () => {
    partidas.lista = []
    const html = await render()
    expect(html).toContain("Nenhuma partida com esses filtros")
  })

  it("lista partidas com placar, resultado e link da súmula", async () => {
    partidas.lista = [linha(1, "2026-04-11T21:00:00")]
    const html = await render()
    expect(html).toContain("Vila Real")
    expect(html).toContain("Vitória")
    expect(html).toContain("Súmula")
    expect(html).toContain('aria-label="Itaquerense 3, Vila Real 1"')
  })

  it("filtra por categoria e marca o filtro ativo", async () => {
    partidas.lista = [linha(1, "2026-04-11T21:00:00"), linha(2, "2026-04-12T21:00:00", { categoria: "Sub-9", fora: "Outro Time" })]
    const html = await render({ categoria: "Sub-9" })
    expect(html).toContain("Outro Time")
    expect(html).not.toContain("Vila Real")
    expect(html).toContain('class="pg-pill is-on" aria-current="page" href="/partidas?categoria=Sub-9"')
    expect(html).toContain("Ainda não há classificação publicada para o Sub-9")
  })

  it("pagina de 20 em 20 com links que mantêm os filtros", async () => {
    partidas.lista = Array.from({ length: 25 }, (_, i) => linha(i + 1, `2026-03-${String(i + 1).padStart(2, "0")}T10:00:00`))
    const html = await render({ situacao: "realizados" })
    expect((html.match(/class="pt-linha/g) ?? []).length).toBe(20)
    expect(html).toContain('href="/partidas?situacao=realizados&amp;pagina=2"')
  })
})
