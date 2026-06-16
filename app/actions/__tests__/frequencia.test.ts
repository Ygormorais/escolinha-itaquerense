import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    aluno: { findMany: vi.fn() },
    frequencia: { upsert: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import {
  salvarFrequencia,
  getResumoFrequenciaMes,
  getEstatisticasFrequencia,
} from "@/app/actions/frequencia"
import { db } from "@/lib/db"

const m = db as unknown as {
  aluno: { findMany: ReturnType<typeof vi.fn> }
  frequencia: { upsert: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.aluno.findMany.mockResolvedValue([])
  m.frequencia.upsert.mockResolvedValue({})
  m.frequencia.findMany.mockResolvedValue([])
})

describe("salvarFrequencia", () => {
  it("faz upsert de cada registro e retorna sucesso", async () => {
    const res = await salvarFrequencia([
      { alunoId: 1, data: "2026-06-01", presenca: "Presente" },
      { alunoId: 2, data: "2026-06-01", presenca: "Ausente" },
    ])
    expect(res).toEqual({ success: true })
    expect(m.frequencia.upsert).toHaveBeenCalledTimes(2)
  })

  it("rejeita presença fora da whitelist sem gravar nada", async () => {
    const res = await salvarFrequencia([
      { alunoId: 1, data: "2026-06-01", presenca: "Presente" },
      { alunoId: 2, data: "2026-06-01", presenca: "Hacked" },
    ])
    expect(res).toEqual({ error: "Valor de presença inválido" })
    expect(m.frequencia.upsert).not.toHaveBeenCalled()
  })

  it("retorna erro amigável quando o upsert falha", async () => {
    m.frequencia.upsert.mockRejectedValueOnce(new Error("db down"))
    const res = await salvarFrequencia([{ alunoId: 1, data: "2026-06-01", presenca: "Presente" }])
    expect(res).toEqual({ error: "db down" })
  })
})

describe("getResumoFrequenciaMes", () => {
  it("contabiliza presentes/ausentes/justificados e calcula pct", async () => {
    m.aluno.findMany.mockResolvedValue([
      {
        id: 1,
        nome: "Aluno A",
        frequencias: [
          { presenca: "Presente" },
          { presenca: "Presente" },
          { presenca: "Ausente" },
          { presenca: "Justificado" },
        ],
      },
      { id: 2, nome: "Aluno B", frequencias: [] },
    ])
    const res = await getResumoFrequenciaMes("Sub-11", "2026-06")
    expect(res[0]).toEqual({
      id: 1,
      nome: "Aluno A",
      total: 4,
      presentes: 2,
      ausentes: 1,
      justificados: 1,
      pct: 50,
    })
    // sem registros => pct nulo
    expect(res[1]).toMatchObject({ id: 2, total: 0, pct: null })
  })
})

describe("getEstatisticasFrequencia", () => {
  it("ranqueia apenas alunos ativos por pct (desc) e ignora inativos", async () => {
    m.frequencia.findMany.mockResolvedValue([
      // Aluno 1 (Ativo): 1/2 presente => 50%
      { alunoId: 1, data: new Date(2026, 5, 1), presenca: "Presente", aluno: { nome: "A", turma: "Sub-9", status: "Ativo" } },
      { alunoId: 1, data: new Date(2026, 5, 3), presenca: "Ausente", aluno: { nome: "A", turma: "Sub-9", status: "Ativo" } },
      // Aluno 2 (Ativo): 1/1 presente => 100%
      { alunoId: 2, data: new Date(2026, 5, 1), presenca: "Presente", aluno: { nome: "B", turma: "Sub-9", status: "Ativo" } },
      // Aluno 3 (Inativo): deve ser ignorado
      { alunoId: 3, data: new Date(2026, 5, 1), presenca: "Presente", aluno: { nome: "C", turma: "Sub-9", status: "Inativo" } },
    ])
    const { ranking } = await getEstatisticasFrequencia("2026-06")
    expect(ranking.map((r) => r.id)).toEqual([2, 1]) // 100% antes de 50%
    expect(ranking.find((r) => r.id === 3)).toBeUndefined()
    expect(ranking[0]).toMatchObject({ id: 2, pct: 100 })
    expect(ranking[1]).toMatchObject({ id: 1, pct: 50 })
  })

  it("agrega o heatmap por dia da semana", async () => {
    // 2026-06-01 é segunda-feira (getDay === 1)
    m.frequencia.findMany.mockResolvedValue([
      { alunoId: 1, data: new Date(2026, 5, 1), presenca: "Presente", aluno: { nome: "A", turma: "Sub-9", status: "Ativo" } },
      { alunoId: 2, data: new Date(2026, 5, 1), presenca: "Ausente", aluno: { nome: "B", turma: "Sub-9", status: "Ativo" } },
    ])
    const { heatmap } = await getEstatisticasFrequencia("2026-06")
    expect(heatmap).toHaveLength(7)
    const seg = heatmap[1] // índice 1 = Seg
    expect(seg).toMatchObject({ dia: "Seg", total: 2, presentes: 1, pct: 50 })
    // dias sem registro permanecem com pct nulo
    expect(heatmap[0]).toMatchObject({ dia: "Dom", total: 0, pct: null })
  })
})
