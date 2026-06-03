import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = { campeonato: { findMany: vi.fn() } }
  return { db }
})
const syncCampeonatoMock = vi.fn()
vi.mock("@/lib/fpfs/sync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/fpfs/sync")>()
  return { ...actual, syncCampeonato: syncCampeonatoMock }
})

import { db } from "@/lib/db"

beforeEach(() => { vi.clearAllMocks() })

describe("syncTodos", () => {
  it("sincroniza apenas campeonatos com fpfsEventoId", async () => {
    ;(db as any).campeonato.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
    syncCampeonatoMock.mockResolvedValue({ campeonatoId: 0, jogosNovos: 0, jogosAtualizados: 0, linhasClassificacao: 0 })
    const { syncTodos } = await import("@/lib/fpfs/sync")
    const resumos = await syncTodos()
    expect((db as any).campeonato.findMany).toHaveBeenCalledWith({
      where: { fpfsEventoId: { not: null } },
      select: { id: true },
    })
    expect(resumos).toHaveLength(2)
  })
})
