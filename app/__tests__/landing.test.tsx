import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { LandingClient } from "@/components/landing/landing-client"
import { heroView } from "@/lib/landing/jogos"
import type { EstatisticasClube } from "@/lib/landing/stats"

const defaultStats: EstatisticasClube = { alunosAtivos: 0, categorias: 0, jogosTemporada: 0, vitorias: 0, temAlgo: false }

describe("landing publica", () => {
  const hero = heroView({ tipo: "institucional" })
  const html = renderToStaticMarkup(<LandingClient categorias={[]} hero={hero} stats={defaultStats} sobre={null} galeria={[]} depoimentos={[]} />)

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
    const h = renderToStaticMarkup(<LandingClient categorias={[]} hero={proximo} stats={defaultStats} sobre={null} galeria={[]} depoimentos={[]} />)
    expect(h).toContain("Próximo desafio: Itaquerense × Vila Real")
    expect(h).toContain('href="#jogos"')
  })
  it("nao tem mais placeholders de noticias nem patrocinadores", () => {
    expect(html).not.toContain("Notícias")
    expect(html).not.toContain("Patrocinadores")
    expect(html).not.toContain("Sócio Torcedor")
    expect(html).not.toContain("Transmissão Ao Vivo")
  })
  it("matricula aparece uma vez no header (so o botao de acesso)", () => {
    const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"))
    expect(header.match(/Matrícula/g)).toHaveLength(1)
  })
  it("hero institucional nao duplica o CTA do banner de matricula", () => {
    const hero = html.slice(html.indexOf('class="hero"'), html.indexOf('id="jogos"'))
    expect(hero).not.toContain("/matricula")
  })
})
