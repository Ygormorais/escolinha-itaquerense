import { describe, it, expect } from "vitest"
import { isPublicRoute } from "@/lib/public-routes"

describe("isPublicRoute", () => {
  it("rotas exatas públicas", () => {
    expect(isPublicRoute("/")).toBe(true)
    expect(isPublicRoute("/login")).toBe(true)
    expect(isPublicRoute("/privacidade")).toBe(true)
    expect(isPublicRoute("/termos")).toBe(true)
    expect(isPublicRoute("/horarios")).toBe(true)
    expect(isPublicRoute("/resultados")).toBe(true)
    expect(isPublicRoute("/frequencia/scanner")).toBe(true)
  })

  it("prefixos públicos e subpaths", () => {
    expect(isPublicRoute("/responsavel")).toBe(true)
    expect(isPublicRoute("/responsavel/dashboard")).toBe(true)
    expect(isPublicRoute("/responsavel/mensalidades")).toBe(true)
    expect(isPublicRoute("/matricula")).toBe(true)
    expect(isPublicRoute("/matricula/nova")).toBe(true)
    expect(isPublicRoute("/noticias/publico")).toBe(true)
    expect(isPublicRoute("/noticias/publico/123")).toBe(true)
  })

  it("rotas protegidas não são públicas", () => {
    expect(isPublicRoute("/dashboard")).toBe(false)
    expect(isPublicRoute("/alunos")).toBe(false)
    expect(isPublicRoute("/alunos/1")).toBe(false)
    expect(isPublicRoute("/pagamentos")).toBe(false)
    expect(isPublicRoute("/admin")).toBe(false)
    expect(isPublicRoute("/noticias")).toBe(false)
  })

  it("não confunde prefixo com rota similar", () => {
    expect(isPublicRoute("/responsavel-admin")).toBe(false)
    expect(isPublicRoute("/matricula-online")).toBe(false)
  })
})
