import { describe, it, expect, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

vi.mock("@/lib/db", () => ({
  db: { campeonato: { findMany: vi.fn().mockResolvedValue([]) } },
}))

vi.mock("next/image", () => ({ default: (p: { alt: string }) => `<img alt="${p.alt}" />` }))

import ResultadosPage from "@/app/resultados/page"

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
})
