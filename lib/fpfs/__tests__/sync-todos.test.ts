import { describe, it, expect, beforeEach, vi } from "vitest"

// syncTodos chama syncCampeonato dentro do mesmo modulo (closure), entao nao da
// para mockar syncCampeonato via mock parcial do modulo em ESM. Em vez disso,
// mockamos as dependencias reais (client/parser/db) para que o syncCampeonato real
// rode sobre dados vazios — assim validamos o filtro do findMany e a iteracao.
vi.mock("@/lib/fpfs/client", () => ({
  urlJogos: (id: number) => `j/${id}`,
  urlClassificacao: (id: number) => `c/${id}`,
  fetchHtml: vi.fn().mockResolvedValue("<html></html>"),
}))
vi.mock("@/lib/fpfs/parser", () => ({
  parseJogos: vi.fn().mockReturnValue([]),
  parseClassificacao: vi.fn().mockReturnValue([]),
  extractTemporadaMeta: vi.fn().mockReturnValue({
    temporada: null,
    categoria: null,
    divisao: null,
  }),
}))
vi.mock("@/lib/db", () => {
  const db = {
    campeonato: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    partida: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    classificacaoFpfs: { deleteMany: vi.fn(), createMany: vi.fn() },
  }
  return { db }
})

import { syncTodos } from "@/lib/fpfs/sync"
import { db } from "@/lib/db"

const m = db as unknown as {
  campeonato: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  classificacaoFpfs: { deleteMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.campeonato.update.mockResolvedValue({})
  m.classificacaoFpfs.deleteMany.mockResolvedValue({})
  m.classificacaoFpfs.createMany.mockResolvedValue({})
})

describe("syncTodos", () => {
  it("filtra campeonatos com fpfsEventoId e sincroniza cada um", async () => {
    m.campeonato.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
    m.campeonato.findUnique.mockImplementation(({ where }: { where: { id: number } }) =>
      Promise.resolve({ id: where.id, fpfsEventoId: 900 + where.id, fpfsTimeNome: null }),
    )

    const resumos = await syncTodos()

    expect(m.campeonato.findMany).toHaveBeenCalledWith({
      where: {
        fpfsEventoId: { not: null },
        status: { not: "encerrado" },
      },
      select: { id: true },
      orderBy: { id: "asc" },
    })
    expect(resumos).toHaveLength(2)
    expect(resumos.map((r) => r.campeonatoId).sort()).toEqual([1, 2])
  })

  it("retorna lista vazia quando nenhum campeonato tem fpfsEventoId", async () => {
    m.campeonato.findMany.mockResolvedValue([])
    const resumos = await syncTodos()
    expect(resumos).toEqual([])
  })
})
