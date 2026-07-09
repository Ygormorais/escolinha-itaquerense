import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    partida: { findMany: vi.fn() },
  }
  return { db }
})

import { getNoticiasCarrossel, linkPartida, resolveFpfsUrl } from "@/lib/landing/noticias"
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
          campeonato: { nome: "Sub-13 A3", fpfsEventoId: 920 },
        },
      ])

    const cards = await getNoticiasCarrossel(new Date("2026-06-01T12:00:00"))
    expect(cards).toHaveLength(1)
    expect(cards[0].externo).toBe(true)
    expect(cards[0].href).toContain("id_jogo=142728")
    expect(cards[0].titulo).toContain("Vitória")
    expect(cards[0].subtitulo).toMatch(/FPFS|súmula/i)
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
