import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { LandingClient } from "@/components/landing/landing-client"
import { heroView } from "@/lib/landing/jogos"

describe("landing publica", () => {
  const hero = heroView({ tipo: "institucional" })
  const html = renderToStaticMarkup(
    <LandingClient
      noticias={[]}
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
    // Destinos continuam no header / CTA final
    expect(html).toContain('href="/horarios"')
    expect(html).toContain('href="/resultados"')
    expect(html).toContain('href="/responsavel"')
  })
  it("nao exibe faixa de stats sem dados reais", () => {
    expect(html).not.toContain("Alunos ativos")
    expect(html).not.toContain("Jogos na temporada")
    expect(html).not.toContain('class="stats"')
  })

  it("exibe stats reais apenas com metrica > 0 e temAlgo", () => {
    const h = renderToStaticMarkup(
      <LandingClient
        noticias={[]}
        noticiasClube={[]}
        hero={hero}
        stats={{
          alunosAtivos: 12,
          categorias: 0,
          jogosTemporada: 9,
          vitorias: 0,
          temAlgo: true,
        }}
        sobre={null}
        galeria={[]}
        depoimentos={[]}
      />
    )
    expect(h).toContain('class="stats"')
    expect(h).toContain("Alunos ativos")
    expect(h).toContain("Jogos na temporada")
    // métricas zeradas não viram card (hero pode citar a palavra "Categorias" no copy)
    expect(h).not.toContain('class="lbl">Categorias')
    expect(h).not.toContain('class="lbl">Vitórias')
  })
  it("hero de proximo jogo renderiza manchete e CTA FPFS", () => {
    const proximo = heroView({
      tipo: "proximo", id: 1, adversario: "Vila Real",
      data: new Date("2026-06-14T16:00:00"), local: "Casa", campeonato: "Sub-9 A3",
      sumulaUrl: null, fpfsEventoId: 920,
    })
    const h = renderToStaticMarkup(
      <LandingClient
        noticias={[]}
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
    expect(html).not.toContain(">Destaques</h2>")
  })

  it("hero institucional e carrossel de jogos nao repetem a mesma manchete", () => {
    const comJogos = renderToStaticMarkup(
      <LandingClient
        noticias={[
          {
            id: 10,
            badge: "Sub-13",
            titulo: "Vitória! Itaquerense 7 × 4 Vila Real",
            subtitulo: "11 de abril de 2026 · Jogo em casa",
            resultado: "Vitoria",
            href: "/resultados",
            externo: false,
          },
        ]}
        noticiasClube={[]}
        hero={hero}
        sobre={null}
        galeria={[]}
        depoimentos={[]}
      />
    )
    // Hero = formação de base; jogos só no carrossel
    expect(comJogos).toContain("Formação de base com paixão itaquerense")
    expect(comJogos).toContain("Jogos e resultados")
    expect(comJogos).toContain("Vitória! Itaquerense 7 × 4 Vila Real")
    const heroSlice = comJogos.slice(
      comJogos.indexOf('class="hero"'),
      comJogos.indexOf('id="noticias"'),
    )
    expect(heroSlice).not.toContain("Vitória!")
    expect(heroSlice).not.toContain("7 × 4")
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
        noticias={[]}
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
