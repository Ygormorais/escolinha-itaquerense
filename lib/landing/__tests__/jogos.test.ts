import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = { campeonato: { findMany: vi.fn() }, partida: { findFirst: vi.fn() } }
  return { db }
})

import { getJogosPorCategoria, getHeroDestaque, heroView } from "@/lib/landing/jogos"
import { db } from "@/lib/db"

const m = db as unknown as {
  campeonato: { findMany: ReturnType<typeof vi.fn> }
  partida: { findFirst: ReturnType<typeof vi.fn> }
}

beforeEach(() => { vi.clearAllMocks() })

describe("getJogosPorCategoria", () => {
  it("agrupa por campeonato e formata placar / VS", async () => {
    m.campeonato.findMany.mockResolvedValue([
      {
        id: 1,
        nome: "Sub-9 A3",
        partidas: [
          { adversario: "Vila Real", local: "Casa", data: new Date("2026-04-11T12:00:00"), golsPro: 2, golsContra: 1, resultado: "Vitoria", sumulaUrl: "s/1" },
          { adversario: "União EC", local: "Fora", data: new Date("2026-04-18T12:00:00"), golsPro: null, golsContra: null, resultado: null, sumulaUrl: null },
        ],
      },
    ])
    const cats = await getJogosPorCategoria()
    expect(cats).toHaveLength(1)
    expect(cats[0].categoria).toBe("Sub-9 A3")
    expect(cats[0].jogos[0]).toMatchObject({ adversario: "Vila Real", placar: "2 × 1", realizado: true, resultado: "Vitoria" })
    expect(cats[0].jogos[1]).toMatchObject({ adversario: "União EC", placar: null, realizado: false })
  })
  it("filtra campeonatos sem jogos", async () => {
    m.campeonato.findMany.mockResolvedValue([
      { id: 1, nome: "Sub-9 A3", partidas: [{ adversario: "X", local: "Casa", data: new Date(), golsPro: 1, golsContra: 0, resultado: "Vitoria", sumulaUrl: null }] },
      { id: 2, nome: "Sub-11", partidas: [] },
    ])
    const cats = await getJogosPorCategoria()
    expect(cats.map((c) => c.categoria)).toEqual(["Sub-9 A3"])
  })
  it("retorna [] quando nao ha campeonatos FPFS", async () => {
    m.campeonato.findMany.mockResolvedValue([])
    expect(await getJogosPorCategoria()).toEqual([])
  })
  it("filtra por fpfsEventoId nao nulo e ordena partidas por data", async () => {
    m.campeonato.findMany.mockResolvedValue([])
    await getJogosPorCategoria()
    expect(m.campeonato.findMany).toHaveBeenCalledWith({
      where: { fpfsEventoId: { not: null } },
      include: { partidas: { orderBy: { data: "asc" } } },
      orderBy: { dataInicio: "desc" },
    })
  })
})

describe("getHeroDestaque", () => {
  const agora = new Date("2026-06-12T12:00:00")

  it("prioriza a proxima partida futura", async () => {
    m.partida.findFirst.mockResolvedValueOnce({
      adversario: "Atlético Leste", local: "Casa", data: new Date("2026-06-14T16:00:00"),
      golsPro: null, golsContra: null, resultado: null,
      campeonato: { nome: "Sub-11 A2" },
    })
    const d = await getHeroDestaque(agora)
    expect(d).toMatchObject({ tipo: "proximo", adversario: "Atlético Leste", campeonato: "Sub-11 A2" })
  })

  it("sem partida futura, usa o ultimo resultado realizado", async () => {
    m.partida.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        adversario: "Vila Real", local: "Fora", data: new Date("2026-06-01T16:00:00"),
        golsPro: 2, golsContra: 1, resultado: "Vitoria",
        campeonato: { nome: "Sub-9 A3" },
      })
    const d = await getHeroDestaque(agora)
    expect(d).toMatchObject({ tipo: "resultado", adversario: "Vila Real", placar: "2 × 1", resultado: "Vitoria" })
  })

  it("sem partida alguma, retorna institucional", async () => {
    m.partida.findFirst.mockResolvedValue(null)
    expect(await getHeroDestaque(agora)).toEqual({ tipo: "institucional" })
  })
})

describe("heroView", () => {
  const base = { adversario: "Vila Real", data: new Date("2026-06-14T16:00:00"), local: "Casa", campeonato: "Sub-9 A3" }

  it("proximo jogo vira manchete com CTA para /resultados", () => {
    const v = heroView({ tipo: "proximo", ...base })
    expect(v.badge).toBe("Sub-9 A3")
    expect(v.titulo).toContain("Vila Real")
    expect(v.descricao).toContain("14/06")
    expect(v.ctaHref).toBe("/resultados")
  })

  it("vitoria celebra com placar", () => {
    const v = heroView({ tipo: "resultado", ...base, placar: "2 × 1", resultado: "Vitoria" })
    expect(v.titulo).toContain("vence")
    expect(v.titulo).toContain("2 × 1")
    expect(v.ctaHref).toBe("/resultados")
  })

  it("empate e derrota usam tom neutro", () => {
    const empate = heroView({ tipo: "resultado", ...base, placar: "1 × 1", resultado: "Empate" })
    expect(empate.titulo).toContain("empata")
    const derrota = heroView({ tipo: "resultado", ...base, placar: "0 × 2", resultado: "Derrota" })
    expect(derrota.titulo).not.toContain("vence")
    expect(derrota.titulo).toContain("0 × 2")
  })

  it("institucional aponta para turmas (matricula ja tem banner proprio)", () => {
    const v = heroView({ tipo: "institucional" })
    expect(v.ctaHref).toBe("/turmas")
    expect(v.titulo.length).toBeGreaterThan(10)
  })
})
