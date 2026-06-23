import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    aluno: { findMany: vi.fn() },
    responsavel: { findMany: vi.fn() },
    campeonato: { findMany: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))

import { buscarGlobal, buscarAlunos } from "@/app/actions/busca"
import { db } from "@/lib/db"

const m = db as unknown as {
  aluno: { findMany: ReturnType<typeof vi.fn> }
  responsavel: { findMany: ReturnType<typeof vi.fn> }
  campeonato: { findMany: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.aluno.findMany.mockResolvedValue([])
  m.responsavel.findMany.mockResolvedValue([])
  m.campeonato.findMany.mockResolvedValue([])
})

describe("buscarGlobal", () => {
  it("retorna listas vazias para query < 2 caracteres", async () => {
    const res = await buscarGlobal("a")
    expect(res).toEqual({ alunos: [], responsaveis: [], campeonatos: [] })
    expect(m.aluno.findMany).not.toHaveBeenCalled()
  })

  it("retorna listas vazias para string vazia", async () => {
    const res = await buscarGlobal("")
    expect(res).toEqual({ alunos: [], responsaveis: [], campeonatos: [] })
  })

  it("consulta as 3 entidades para query >= 2 caracteres", async () => {
    await buscarGlobal("Jo")
    expect(m.aluno.findMany).toHaveBeenCalled()
    expect(m.responsavel.findMany).toHaveBeenCalled()
    expect(m.campeonato.findMany).toHaveBeenCalled()
  })

  it("passa o query como contains no where", async () => {
    await buscarGlobal("Lucas")
    expect(m.aluno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { nome: { contains: "Lucas" } } })
    )
  })

  it("limita a 5 resultados por entidade", async () => {
    await buscarGlobal("Jo")
    expect(m.aluno.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }))
    expect(m.responsavel.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }))
    expect(m.campeonato.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }))
  })

  it("retorna os resultados encontrados", async () => {
    m.aluno.findMany.mockResolvedValueOnce([{ id: 1, nome: "João Silva", turma: "Sub-13", status: "Ativo" }])
    m.campeonato.findMany.mockResolvedValueOnce([{ id: 1, nome: "Copa João", status: "andamento" }])
    const res = await buscarGlobal("João")
    expect(res.alunos).toHaveLength(1)
    expect(res.campeonatos).toHaveLength(1)
    expect(res.responsaveis).toHaveLength(0)
  })
})

describe("buscarAlunos", () => {
  it("retorna [] para query < 2 caracteres", async () => {
    const res = await buscarAlunos("L")
    expect(res).toEqual([])
    expect(m.aluno.findMany).not.toHaveBeenCalled()
  })

  it("busca alunos pelo nome", async () => {
    const mock = [{ id: 1, nome: "Lucas Oliveira", turma: "Sub-13", status: "Ativo" }]
    m.aluno.findMany.mockResolvedValueOnce(mock)
    const res = await buscarAlunos("Lucas")
    expect(res).toEqual(mock)
    expect(m.aluno.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { nome: { contains: "Lucas" } }, take: 8 })
    )
  })
})
