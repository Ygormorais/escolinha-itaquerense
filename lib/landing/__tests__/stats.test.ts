import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    partida: { count: vi.fn() },
  }
  return { db }
})

import { getEstatisticasClube } from "@/lib/landing/stats"
import { db } from "@/lib/db"

const m = db as unknown as {
  partida: { count: ReturnType<typeof vi.fn> }
}

beforeEach(() => { vi.clearAllMocks() })

describe("getEstatisticasClube", () => {
  it("deriva só métricas públicas de competição e marca temAlgo=true", async () => {
    m.partida.count.mockImplementation(({ where }: { where: { resultado?: string } }) =>
      Promise.resolve(where.resultado === "Vitoria" ? 4 : 9)
    )
    const r = await getEstatisticasClube(new Date("2026-06-17T12:00:00"))
    expect(r).toEqual({ jogosTemporada: 9, vitorias: 4, temAlgo: true })
  })

  it("não expõe alunos ativos nem categorias (dados internos)", async () => {
    m.partida.count.mockResolvedValue(1)
    const r = await getEstatisticasClube(new Date("2026-06-17T12:00:00"))
    expect(r).not.toHaveProperty("alunosAtivos")
    expect(r).not.toHaveProperty("categorias")
  })

  it("temAlgo=false quando não há jogos nem vitórias", async () => {
    m.partida.count.mockResolvedValue(0)
    const r = await getEstatisticasClube(new Date("2026-06-17T12:00:00"))
    expect(r.temAlgo).toBe(false)
  })

  it("filtra partidas pelo ano de agora", async () => {
    m.partida.count.mockResolvedValue(0)
    await getEstatisticasClube(new Date("2026-06-17T12:00:00"))
    const call = m.partida.count.mock.calls[0][0]
    expect(call.where.data.gte).toEqual(new Date("2026-01-01T00:00:00.000Z"))
    expect(call.where.data.lt).toEqual(new Date("2027-01-01T00:00:00.000Z"))
  })
})
