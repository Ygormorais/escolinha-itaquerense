import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    partida: { findMany: vi.fn() },
  }
  return { db }
})

import {
  categoriaCurta,
  getNoticiasCarrossel,
  getNoticiasPorCategoria,
  linkPartida,
  nomeTime,
  resolveFpfsUrl,
} from "@/lib/landing/noticias"
import { db } from "@/lib/db"

const m = db as unknown as {
  partida: { findMany: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("resolveFpfsUrl", () => {
  it("aceita sumula absoluta da FPFS e força https", () => {
    expect(
      resolveFpfsUrl("http://admfutsal.com.br/sumula_online/sumula_imprimir.php?id_jogo=142728")
    ).toBe("https://admfutsal.com.br/sumula_online/sumula_imprimir.php?id_jogo=142728")
  })

  it("aceita path relativo resolvido no host de eventos", () => {
    expect(resolveFpfsUrl("/evento/920/jogos")).toBe("https://eventos.admfutsal.com.br/evento/920/jogos")
  })

  it("rejeita hosts externos", () => {
    expect(resolveFpfsUrl("https://evil.example/phish")).toBeNull()
  })
})

describe("linkPartida", () => {
  it("prioriza sumula quando existe", () => {
    const r = linkPartida({
      sumulaUrl: "http://admfutsal.com.br/sumula_online/sumula_imprimir.php?id_jogo=1",
      campeonato: { fpfsEventoId: 920 },
    })
    expect(r.externo).toBe(true)
    expect(r.href).toContain("id_jogo=1")
  })

  it("usa pagina de jogos do evento quando nao ha sumula", () => {
    const r = linkPartida({
      sumulaUrl: null,
      campeonato: { fpfsEventoId: 920 },
    })
    expect(r).toEqual({
      href: "https://eventos.admfutsal.com.br/evento/920/jogos",
      externo: true,
    })
  })

  it("cai em /resultados sem dados FPFS", () => {
    expect(linkPartida({ sumulaUrl: null, campeonato: { fpfsEventoId: null } })).toEqual({
      href: "/resultados",
      externo: false,
    })
  })
})

describe("getNoticiasCarrossel", () => {
  it("monta cards com link de sumula FPFS", async () => {
    m.partida.findMany
      .mockResolvedValueOnce([]) // proximos
      .mockResolvedValueOnce([
        {
          id: 10,
          adversario: "Vila Real",
          local: "Casa",
          data: new Date("2026-04-11T12:00:00"),
          golsPro: 3,
          golsContra: 1,
          resultado: "Vitoria",
          sumulaUrl: "http://admfutsal.com.br/sumula_online/sumula_imprimir.php?id_jogo=142728",
          adversarioEscudoUrl: "http://admfutsal.com.br/assets/images/foto/escudo/12893.png",
          campeonato: { nome: "Sub-13 A3", fpfsEventoId: 920 },
        },
      ])

    const cards = await getNoticiasCarrossel(new Date("2026-06-01T12:00:00"))
    expect(cards).toHaveLength(1)
    expect(cards[0].externo).toBe(true)
    expect(cards[0].href).toContain("id_jogo=142728")
    expect(cards[0].titulo).toContain("Vitória")
    expect(cards[0].subtitulo).toMatch(/FPFS|súmula/i)
    expect(cards[0].casa).toBe("Itaquerense")
    expect(cards[0].fora).toBe("Vila Real")
    expect(cards[0].placar).toBe("3 × 1")
    // deve haver ao menos uma candidata (FPFS e/ou resolução na web)
    expect(cards[0].foraEscudos.length).toBeGreaterThanOrEqual(1)
  })

  it("inclui logo de clube conhecido (manual local ou logodetimes)", async () => {
    m.partida.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 11,
          adversario: "SPORT CLUB CORINTHIANS PAULISTA",
          local: "Casa",
          data: new Date("2026-04-11T12:00:00"),
          golsPro: 1,
          golsContra: 0,
          resultado: "Vitoria",
          sumulaUrl: null,
          adversarioEscudoUrl: null,
          campeonato: { nome: "Sub-18", fpfsEventoId: 851 },
        },
      ])
    const cards = await getNoticiasCarrossel(new Date("2026-06-01T12:00:00"))
    const crest = cards[0].foraEscudos[0] ?? ""
    expect(
      crest.includes("logodetimes.com/times/corinthians") ||
        crest.includes("/landing/escudos/") ||
        crest.includes("corinthians"),
    ).toBe(true)
  })

  it("jogo fora coloca adversario a esquerda e inverte placar", async () => {
    m.partida.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 12,
          adversario: "Vila Real",
          local: "Fora",
          data: new Date("2026-04-11T12:00:00"),
          golsPro: 2,
          golsContra: 5,
          resultado: "Derrota",
          sumulaUrl: null,
          adversarioEscudoUrl: null,
          campeonato: { nome: "Sub-13", fpfsEventoId: 920 },
        },
      ])
    const cards = await getNoticiasCarrossel(new Date("2026-06-01T12:00:00"))
    expect(cards[0].nosCasa).toBe(false)
    expect(cards[0].casa).toBe("Vila Real")
    expect(cards[0].fora).toBe("Itaquerense")
    // placar no sentido do mando: casa 5 × visitante 2
    expect(cards[0].placar).toBe("5 × 2")
  })

  it("nomeTime normaliza CAPS da FPFS", () => {
    expect(nomeTime("ASSOCIAÇÃO DESPORTIVA INDAIATUBA")).toBe("Associação Desportiva Indaiatuba")
    expect(nomeTime("Vila Real")).toBe("Vila Real")
  })

  it("sem partidas retorna vazio (hero institucional cobre a marca)", async () => {
    m.partida.findMany.mockResolvedValue([])
    const cards = await getNoticiasCarrossel()
    expect(cards).toEqual([])
  })

  it("excludeIds remove a partida ja exibida no hero", async () => {
    m.partida.findMany
      .mockResolvedValueOnce([
        {
          id: 99,
          adversario: "Atlético Leste",
          local: "Casa",
          data: new Date("2026-06-14T16:00:00"),
          golsPro: null,
          golsContra: null,
          resultado: null,
          sumulaUrl: null,
          adversarioEscudoUrl: null,
          campeonato: { nome: "Sub-11", fpfsEventoId: 1 },
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 10,
          adversario: "Vila Real",
          local: "Casa",
          data: new Date("2026-04-11T12:00:00"),
          golsPro: 3,
          golsContra: 1,
          resultado: "Vitoria",
          sumulaUrl: "http://admfutsal.com.br/sumula_online/sumula_imprimir.php?id_jogo=142728",
          adversarioEscudoUrl: null,
          campeonato: { nome: "Sub-13 A3", fpfsEventoId: 920 },
        },
      ])

    const cards = await getNoticiasCarrossel(new Date("2026-06-01T12:00:00"), {
      excludeIds: [99],
    })
    expect(cards.map((c) => c.id)).toEqual([10])
    expect(m.partida.findMany.mock.calls[0][0].where.id).toEqual({ notIn: [99] })
    expect(m.partida.findMany.mock.calls[1][0].where.id).toEqual({ notIn: [99] })
  })
})

describe("categoriaCurta", () => {
  it("extrai Sub-N do nome do campeonato FPFS", () => {
    expect(categoriaCurta("FPFS Categoria Sub-18 · ev.851")).toBe("Sub-18")
    expect(categoriaCurta("FPFS Categoria Sub 9 · ev.864")).toBe("Sub-9")
    expect(categoriaCurta("Sub-13 A3")).toBe("Sub-13")
  })
})

describe("getNoticiasPorCategoria", () => {
  it("agrupa jogos por Sub e nao deixa uma categoria monopolizar", async () => {
    m.partida.findMany
      .mockResolvedValueOnce([]) // proximos
      .mockResolvedValueOnce([
        {
          id: 1,
          adversario: "Time A",
          local: "Casa",
          data: new Date("2026-06-10"),
          golsPro: 2,
          golsContra: 1,
          resultado: "Vitoria",
          sumulaUrl: null,
          adversarioEscudoUrl: null,
          campeonato: { nome: "FPFS Categoria Sub-18 · ev.851", fpfsEventoId: 851 },
        },
        {
          id: 2,
          adversario: "Time B",
          local: "Casa",
          data: new Date("2026-06-09"),
          golsPro: 1,
          golsContra: 1,
          resultado: "Empate",
          sumulaUrl: null,
          adversarioEscudoUrl: null,
          campeonato: { nome: "FPFS Categoria Sub-18 · ev.851", fpfsEventoId: 851 },
        },
        {
          id: 3,
          adversario: "Time C",
          local: "Fora",
          data: new Date("2026-06-08"),
          golsPro: 0,
          golsContra: 2,
          resultado: "Derrota",
          sumulaUrl: null,
          adversarioEscudoUrl: null,
          campeonato: { nome: "FPFS Categoria Sub-12 · ev.854", fpfsEventoId: 854 },
        },
      ])

    const grupos = await getNoticiasPorCategoria(new Date("2026-06-15"))
    expect(grupos.map((g) => g.categoria)).toEqual(["Sub-12", "Sub-18"])
    expect(grupos.find((g) => g.categoria === "Sub-12")!.items).toHaveLength(1)
    expect(grupos.find((g) => g.categoria === "Sub-18")!.items).toHaveLength(2)
    expect(grupos[0].items[0].badge).toBe("Sub-12")
  })
})
