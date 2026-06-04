import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = { campeonato: { findMany: vi.fn() } }
  return { db }
})

import { getJogosPorCategoria } from "@/lib/landing/jogos"
import { db } from "@/lib/db"

const m = db as unknown as { campeonato: { findMany: ReturnType<typeof vi.fn> } }

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
