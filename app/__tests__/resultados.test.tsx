import { describe, it, expect, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

vi.mock("@/lib/db", () => ({
  db: {
    campeonato: { findMany: vi.fn().mockResolvedValue([]) },
    partida: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}))

vi.mock("@/lib/landing/noticias", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/landing/noticias")>()
  return {
    ...actual,
    getNoticiasPorCategoria: vi.fn().mockResolvedValue([]),
  }
})

vi.mock("next/image", () => ({
  default: (p: { alt: string }) => `<img alt="${p.alt}" />`,
}))

import ResultadosPage from "@/app/resultados/page"
import { getNoticiasPorCategoria } from "@/lib/landing/noticias"

describe("ResultadosPage", () => {
  it("renderiza sem erros com lista vazia", async () => {
    const jsx = await ResultadosPage()
    expect(() => renderToStaticMarkup(jsx)).not.toThrow()
  })

  it("exibe mensagem quando nao ha campeonatos", async () => {
    const jsx = await ResultadosPage()
    const html = renderToStaticMarkup(jsx)
    expect(html).toContain("Nenhum campeonato")
  })

  it("renderiza abas e cards quando ha jogos por categoria", async () => {
    vi.mocked(getNoticiasPorCategoria).mockResolvedValueOnce([
      {
        categoria: "Sub-13",
        items: [
          {
            id: 1,
            badge: "Sub-13",
            titulo: "Vitória! Itaquerense 3 × 1 Vila Real",
            subtitulo: "11 de abril de 2026 · Jogo em casa",
            resultado: "Vitoria",
            href: "/resultados",
            externo: false,
            casa: "Itaquerense",
            fora: "Vila Real",
            nosCasa: true,
            placar: "3 × 1",
            foraEscudos: [],
          },
        ],
      },
      {
        categoria: "Sub-18",
        items: [
          {
            id: 2,
            badge: "Sub-18",
            titulo: "Próximo jogo: Itaquerense × Grêmio",
            subtitulo: "20 de junho de 2026 · Jogo fora",
            resultado: "Proximo",
            href: "/resultados",
            externo: false,
            casa: "Grêmio",
            fora: "Itaquerense",
            nosCasa: false,
            placar: null,
            foraEscudos: [],
          },
        ],
      },
    ])

    const jsx = await ResultadosPage()
    const html = renderToStaticMarkup(jsx)
    expect(html).toContain("Sub-13")
    expect(html).toContain("Sub-18")
    expect(html).toContain("Vila Real")
    expect(html).toContain("Jogos &amp; Classificação")
  })
})
