import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))

import { faixaPartida, montarSlidesHero, type NoticiaHero } from "@/lib/landing/hero"
import type { HeroDestaque } from "@/lib/landing/jogos"

const proximo: HeroDestaque = {
  tipo: "proximo",
  id: 1,
  adversario: "Vila Real",
  data: new Date(2026, 9, 30, 19, 30),
  local: "Casa",
  campeonato: "Sub-11 A3",
  sumulaUrl: null,
  fpfsEventoId: 123,
}

const resultado: HeroDestaque = {
  tipo: "resultado",
  id: 2,
  adversario: "Santo André",
  data: new Date(2026, 9, 12, 10, 0),
  local: "Fora",
  campeonato: "Sub-9 A3",
  placar: "3 × 1",
  resultado: "Vitoria",
  sumulaUrl: "/sumula/9",
  fpfsEventoId: 55,
}

describe("faixaPartida", () => {
  it("sem jogos a faixa não aparece", () => {
    expect(faixaPartida({ tipo: "institucional" })).toBeNull()
  })

  it("próxima partida mostra data com hora, mando de campo e link da FPFS", () => {
    const f = faixaPartida(proximo)!
    expect(f).toMatchObject({
      rotulo: "Próxima partida",
      campeonato: "Sub-11 A3",
      adversario: "Vila Real",
      placar: null,
      quando: "30/10 às 19:30",
      local: "Jogo em casa",
      externo: true,
      ctaLabel: "Ver na FPFS",
    })
    expect(f.href).toContain("admfutsal.com.br")
  })

  it("último resultado traz o placar com o nosso gol primeiro e leva à súmula", () => {
    const f = faixaPartida(resultado)!
    expect(f).toMatchObject({
      rotulo: "Último resultado",
      adversario: "Santo André",
      placar: "3 × 1",
      quando: "12/10/2026",
      local: "Jogo fora",
      ctaLabel: "Ver súmula",
      externo: true,
    })
  })

  it("sem súmula nem evento na FPFS, aponta para a página interna de resultados", () => {
    const f = faixaPartida({ ...proximo, fpfsEventoId: null })!
    expect(f).toMatchObject({ href: "/resultados", externo: false, ctaLabel: "Ver jogos" })
    const r = faixaPartida({ ...resultado, sumulaUrl: null, fpfsEventoId: null })!
    expect(r).toMatchObject({ href: "/resultados", externo: false, ctaLabel: "Ver resultados" })
  })

  it("mantém o texto bruto do local quando não é Casa nem Fora", () => {
    expect(faixaPartida({ ...proximo, local: "Ginásio Municipal" })!.local).toBe("Ginásio Municipal")
  })
})

function noticia(id: number, parcial: Partial<NoticiaHero> = {}): NoticiaHero {
  return { id, titulo: `Título ${id}`, subtitulo: `Sub ${id}`, categoria: "Conquista", imagemUrl: null, ...parcial }
}

describe("montarSlidesHero", () => {
  it("sem publicações, fica com institucional e história", () => {
    expect(montarSlidesHero([]).map((s) => s.id)).toEqual(["institucional", "historia"])
  })

  it("publicações entram entre o institucional e a história", () => {
    const ids = montarSlidesHero([noticia(1), noticia(2)]).map((s) => s.id)
    expect(ids).toEqual(["institucional", "noticia-1", "noticia-2", "historia"])
  })

  it("nenhum slide repete o CTA de matrícula, que já tem botão no cabeçalho e banner no fim", () => {
    for (const s of montarSlidesHero([noticia(1)])) expect(s.cta.href).not.toContain("/matricula")
  })

  it("limita a 3 publicações", () => {
    const slides = montarSlidesHero([1, 2, 3, 4, 5].map((i) => noticia(i)))
    expect(slides.filter((s) => s.id.startsWith("noticia-"))).toHaveLength(3)
  })

  it("publicação vira slide com categoria, foto e link para as publicações", () => {
    const s = montarSlidesHero([noticia(7, { categoria: "Convocação", imagemUrl: "https://x.test/a.jpg", subtitulo: null })])
      .find((x) => x.id === "noticia-7")!
    expect(s).toMatchObject({
      kicker: "Convocação",
      titulo: "Título 7",
      aba: "Título 7",
      descricao: "",
      imagem: "https://x.test/a.jpg",
      cta: { label: "Ler publicação", href: "/noticias/publico" },
    })
  })

  it("publicação sem foto não carrega imagem", () => {
    const s = montarSlidesHero([noticia(1)]).find((x) => x.id === "noticia-1")!
    expect(s.imagem).toBeUndefined()
  })

  it("todo slide tem texto e um CTA com destino", () => {
    for (const s of montarSlidesHero([noticia(1)])) {
      expect(s.titulo.length).toBeGreaterThan(0)
      expect(s.cta.href.length).toBeGreaterThan(0)
      expect(s.cta.label.length).toBeGreaterThan(0)
    }
  })

  it("ids são únicos", () => {
    const ids = montarSlidesHero([noticia(1), noticia(2), noticia(3)]).map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
