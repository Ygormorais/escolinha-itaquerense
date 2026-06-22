import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { LandingClient } from "@/components/landing/landing-client"
import { heroView } from "@/lib/landing/jogos"

describe("landing publica", () => {
  const hero = heroView({ tipo: "institucional" })
  const html = renderToStaticMarkup(
    <LandingClient noticias={[]} noticiasClube={[]} hero={hero} sobre={null} galeria={[]} depoimentos={[]} />
  )

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
  })
  it("hero de proximo jogo renderiza manchete e CTA para /resultados", () => {
    const proximo = heroView({
      tipo: "proximo", adversario: "Vila Real",
      data: new Date("2026-06-14T16:00:00"), local: "Casa", campeonato: "Sub-9 A3",
    })
    const h = renderToStaticMarkup(
      <LandingClient noticias={[]} noticiasClube={[]} hero={proximo} sobre={null} galeria={[]} depoimentos={[]} />
    )
    expect(h).toContain("Próximo desafio: Itaquerense × Vila Real")
    expect(h).toContain('href="/resultados"')
  })
  it("nao tem mais placeholders de noticias nem patrocinadores", () => {
    expect(html).not.toContain("Patrocinadores")
    expect(html).not.toContain("Sócio Torcedor")
    expect(html).not.toContain("Transmissão Ao Vivo")
  })
  it("matricula aparece uma vez no header (so o botao de acesso)", () => {
    const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"))
    expect(header.match(/Matrícula/g)).toHaveLength(1)
  })
  it("hero institucional nao duplica o CTA do banner de matricula", () => {
    const heroSection = html.slice(html.indexOf('class="hero"'), html.indexOf('id="noticias"'))
    expect(heroSection).not.toContain("/matricula")
  })
})
