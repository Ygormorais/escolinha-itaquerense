import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import Landing from "@/app/page"

describe("landing pública", () => {
  const html = renderToStaticMarkup(<Landing />)

  it("expõe o acesso à Administração", () => {
    expect(html).toContain('href="/login"')
  })
  it("expõe o Portal do Responsável", () => {
    expect(html).toContain('href="/responsavel"')
  })
  it("expõe a Matrícula", () => {
    expect(html).toContain('href="/matricula"')
  })
})
