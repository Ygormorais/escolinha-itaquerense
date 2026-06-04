import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { LandingClient } from "@/components/landing/landing-client"

describe("landing publica", () => {
  const html = renderToStaticMarkup(<LandingClient categorias={[]} />)

  it("expoe o acesso a Administracao", () => {
    expect(html).toContain('href="/login"')
  })
  it("expoe o Portal do Responsavel", () => {
    expect(html).toContain('href="/responsavel"')
  })
  it("expoe a Matricula", () => {
    expect(html).toContain('href="/matricula"')
  })
})
