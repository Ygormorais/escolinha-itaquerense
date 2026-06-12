import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { LandingClient } from "@/components/landing/landing-client"
import { heroView } from "@/lib/landing/jogos"

describe("landing publica", () => {
  const hero = heroView({ tipo: "institucional" })
  const html = renderToStaticMarkup(<LandingClient categorias={[]} hero={hero} />)

  it("expoe o acesso a Administracao", () => {
    expect(html).toContain('href="/login"')
  })
  it("expoe o Portal do Responsavel", () => {
    expect(html).toContain('href="/responsavel"')
  })
  it("expoe a Matricula", () => {
    expect(html).toContain('href="/matricula"')
  })
  it("renderiza o hero vindo do servidor", () => {
    expect(html).toContain("Formação de base com paixão itaquerense")
    expect(html).toContain('href="/matricula"')
  })
  it("hero de proximo jogo renderiza manchete e CTA para #jogos", () => {
    const proximo = heroView({
      tipo: "proximo", adversario: "Vila Real",
      data: new Date("2026-06-14T16:00:00"), local: "Casa", campeonato: "Sub-9 A3",
    })
    const h = renderToStaticMarkup(<LandingClient categorias={[]} hero={proximo} />)
    expect(h).toContain("Próximo desafio: Itaquerense × Vila Real")
    expect(h).toContain('href="#jogos"')
  })
  it("nao tem mais placeholders de noticias nem patrocinadores", () => {
    expect(html).not.toContain("Notícias")
    expect(html).not.toContain("Patrocinadores")
    expect(html).not.toContain("Sócio Torcedor")
    expect(html).not.toContain("Transmissão Ao Vivo")
  })
})
