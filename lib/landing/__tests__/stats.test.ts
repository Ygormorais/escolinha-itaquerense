import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    aluno: { count: vi.fn(), findMany: vi.fn() },
    partida: { count: vi.fn() },
  }
  return { db }
})

import { getEstatisticasClube } from "@/lib/landing/stats"
import { db } from "@/lib/db"

const m = db as unknown as {
  aluno: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
  partida: { count: ReturnType<typeof vi.fn> }
}

beforeEach(() => { vi.clearAllMocks() })

describe("getEstatisticasClube", () => {
  it("deriva métricas e marca temAlgo=true", async () => {
    m.aluno.count.mockResolvedValue(12)
    m.aluno.findMany.mockResolvedValue([{ turma: "Sub-9" }, { turma: "Sub-9" }, { turma: "Sub-11" }])
    m.partida.count.mockImplementation(({ where }: any) =>
      Promise.resolve(where.resultado === "Vitoria" ? 4 : 9)
    )
    const r = await getEstatisticasClube(new Date("2026-06-17T12:00:00"))
    expect(r).toEqual({ alunosAtivos: 12, categorias: 2, jogosTemporada: 9, vitorias: 4, temAlgo: true })
  })

  it("temAlgo=false quando tudo zero", async () => {
    m.aluno.count.mockResolvedValue(0)
    m.aluno.findMany.mockResolvedValue([])
    m.partida.count.mockResolvedValue(0)
    const r = await getEstatisticasClube(new Date("2026-06-17T12:00:00"))
    expect(r.temAlgo).toBe(false)
  })

  it("filtra partidas pelo ano de agora", async () => {
    m.aluno.count.mockResolvedValue(1)
    m.aluno.findMany.mockResolvedValue([{ turma: "Sub-9" }])
    m.partida.count.mockResolvedValue(0)
    await getEstatisticasClube(new Date("2026-06-17T12:00:00"))
    const call = m.partida.count.mock.calls[0][0]
    expect(call.where.data.gte).toEqual(new Date("2026-01-01T00:00:00.000Z"))
    expect(call.where.data.lt).toEqual(new Date("2027-01-01T00:00:00.000Z"))
  })
})
