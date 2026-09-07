import { beforeEach, expect, it, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: {
  configuracaoTurma: { findMany: vi.fn() },
  aluno: { groupBy: vi.fn() },
} }))

import { db } from "@/lib/db"
import { buscarOperacaoLocal } from "../busca-operacional"

beforeEach(() => {
  vi.mocked(db.configuracaoTurma.findMany).mockResolvedValue([
    { id: "1", nome: "Sub-11", capacidade: 10, _count: { listaEspera: 2 } },
    { id: "2", nome: "Sub-13", capacidade: 10, _count: { listaEspera: 0 } },
    { id: "3", nome: "Sub-15", capacidade: 10, _count: { listaEspera: 1 } },
  ] as never)
  vi.mocked(db.aluno.groupBy).mockResolvedValue([
    { turma: "Sub-11", _count: { _all: 10 } },
    { turma: "Sub-13", _count: { _all: 12 } },
    { turma: "Sub-15", _count: { _all: 8 } },
  ] as never)
})

it("combina lotação e presença na lista de espera", async () => {
  const resposta = await buscarOperacaoLocal("quais turmas estão lotadas e têm lista de espera?")
  expect(resposta.dados?.resultados.map(item => item.titulo)).toEqual(["Sub-11"])
  expect(resposta.dados?.criterios).toHaveLength(3)
})

it("mantém a visão geral quando não há filtros explícitos", async () => {
  const resposta = await buscarOperacaoLocal("ocupação e capacidade das turmas")
  expect(resposta.dados?.resultados).toHaveLength(3)
})
