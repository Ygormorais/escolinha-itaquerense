import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { LandingClient } from "@/components/landing/landing-client"
import { heroView } from "@/lib/landing/jogos"

describe("landing publica", () => {
  const hero = heroView({ tipo: "institucional" })
  const html = renderToStaticMarkup(
    <LandingClient
      jogosPorCategoria={[]}
      noticiasClube={[]}
      hero={hero}
      sobre={null}
      galeria={[]}
      depoimentos={[]}
    />
  )

  it("expoe o acesso a Administracao", () => {
    expect(html).toContain('href="/login"')
  })
  it("expoe o Portal da familia", () => {
    expect(html).toContain('href="/responsavel"')
    expect(html).toContain("Portal da família")
  })
  it("expoe a Matricula", () => {
    expect(html).toContain('href="/matricula"')
  })
  it("renderiza o hero vindo do servidor", () => {
    expect(html).toContain("Formação de base com paixão itaquerense")
  })
  it("nao repete faixas de navegacao/pitch (acesso-grid nem O que oferecemos)", () => {
    expect(html).not.toContain("acesso-grid")
    expect(html).not.toContain("O que oferecemos")
    expect(html).toContain('href="/horarios"')
    expect(html).toContain('href="/resultados"')
    expect(html).toContain('href="/responsavel"')
  })
  it("nao exibe faixa de alunos/categorias/stats", () => {
    expect(html).not.toContain("Alunos ativos")
    expect(html).not.toContain("Jogos na temporada")
    expect(html).not.toContain('class="stats"')
  })
  it("hero de proximo jogo renderiza manchete e CTA FPFS", () => {
    const proximo = heroView({
      tipo: "proximo", id: 1, adversario: "Vila Real",
      data: new Date("2026-06-14T16:00:00"), local: "Casa", campeonato: "Sub-9 A3",
      sumulaUrl: null, fpfsEventoId: 920,
    })
    const h = renderToStaticMarkup(
      <LandingClient
        jogosPorCategoria={[]}
        noticiasClube={[]}
        hero={proximo}
        sobre={null}
        galeria={[]}
        depoimentos={[]}
      />
    )
    expect(h).toContain("Próximo desafio: Itaquerense × Vila Real")
    expect(h).toContain("eventos.admfutsal.com.br/evento/920/jogos")
    expect(h).toContain('target="_blank"')
  })

  it("com noticias vazias nao renderiza carrossel de jogos", () => {
    expect(html).not.toContain(">Jogos e resultados</h2>")
  })

  it("exibe secao de noticias e conquistas com abas", () => {
    expect(html).toContain("Notícias e conquistas")
    expect(html).toContain("Mundial")
    expect(html).toContain("Campeão Mundial Sub-13 na França")
    expect(html).toContain('href="#materias"')
  })

  it("exibe marcos reais do clube", () => {
    expect(html).toContain("Mundial Sub-13")
    expect(html).toContain("1922")
    expect(html).toContain("6 mil+")
    expect(html).not.toContain('class="stats"')
  })

  it("exibe voz institucional quando ha depoimento", () => {
    const comVoz = renderToStaticMarkup(
      <LandingClient
        jogosPorCategoria={[]}
        noticiasClube={[]}
        hero={hero}
        sobre={null}
        galeria={[]}
        depoimentos={[
          {
            texto: "Formar caráter pelo esporte.",
            autor: 'Moacir Bernardes · "Simão"',
            categoria: "Coordenador de futsal",
          },
        ]}
      />,
    )
    expect(comVoz).toContain("Voz do clube")
    expect(comVoz).toContain("Simão")
  })

  it("hero institucional e carrossel de jogos nao repetem a mesma manchete", () => {
    const comJogos = renderToStaticMarkup(
      <LandingClient
        jogosPorCategoria={[
          {
            categoria: "Sub-13",
            items: [
              {
                id: 10,
                badge: "Sub-13",
                titulo: "Vitória! Itaquerense 7 × 4 Vila Real",
                subtitulo: "11 de abril de 2026 · Jogo em casa",
                resultado: "Vitoria",
                href: "/resultados",
                externo: false,
                casa: "Itaquerense",
                fora: "Vila Real",
                nosCasa: true,
                placar: "7 × 4",
                foraEscudos: [
                  "https://logodetimes.com/times/corinthians/logo-corinthians-256.png",
                ],
              },
            ],
          },
          {
            categoria: "Sub-18",
            items: [
              {
                id: 20,
                badge: "Sub-18",
                titulo: "Empate",
                subtitulo: "1 de maio",
                resultado: "Empate",
                href: "/resultados",
                externo: false,
                casa: "Itaquerense",
                fora: "Palmeiras",
                nosCasa: true,
                placar: "1 × 1",
                foraEscudos: [
                  "https://logodetimes.com/times/palmeiras/logo-palmeiras-256.png",
                ],
              },
            ],
          },
        ]}
        noticiasClube={[]}
        hero={hero}
        sobre={null}
        galeria={[]}
        depoimentos={[]}
      />
    )
    expect(comJogos).toContain("Formação de base com paixão itaquerense")
    expect(comJogos).toContain("Jogos e resultados")
    expect(comJogos).toContain("Vila Real")
    expect(comJogos).toContain("Sub-13")
    expect(comJogos).toContain("Sub-18")
    expect(comJogos).toContain('class="nc-tabs"')
    expect(comJogos).toContain('class="nc-tab active"')
    expect(comJogos).toContain('class="nc-feature')
    expect(comJogos).toContain('class="nc-scoreline"')
    const heroSlice = comJogos.slice(
      comJogos.indexOf('class="hero"'),
      comJogos.indexOf('id="noticias"'),
    )
    expect(heroSlice).not.toContain("Vila Real")
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
  it("nao mostra WhatsApp flutuante sem numero", () => {
    expect(html).not.toContain('class="wa-float"')
    expect(html).not.toContain("Fale conosco pelo WhatsApp")
  })
  it("mostra WhatsApp flutuante com numero configurado", () => {
    const h = renderToStaticMarkup(
      <LandingClient
        jogosPorCategoria={[]}
        noticiasClube={[]}
        hero={hero}
        sobre={null}
        galeria={[]}
        depoimentos={[]}
        whatsapp="5511958686579"
      />
    )
    expect(h).toContain('class="wa-float"')
    expect(h).toContain("wa.me/5511958686579")
    expect(h).toContain("Fale conosco pelo WhatsApp")
  })
})
