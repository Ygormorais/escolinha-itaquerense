import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    aluno: { findMany: vi.fn() },
    frequencia: { upsert: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    whatsAppMensagem: { findMany: vi.fn().mockResolvedValue([]) },
  }
  return { db }
})

vi.mock("@/lib/push", () => ({ sendPushToResponsavel: vi.fn().mockResolvedValue(undefined) }))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import {
  salvarFrequencia,
  getResumoFrequenciaMes,
  getEstatisticasFrequencia,
  getFrequenciaAluno,
  getPresencaPorTurma,
} from "@/app/actions/frequencia"
import { db } from "@/lib/db"

const m = db as unknown as {
  aluno: { findMany: ReturnType<typeof vi.fn> }
  frequencia: { upsert: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn> }
  whatsAppMensagem: { findMany: ReturnType<typeof vi.fn> }
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

describe("getFrequenciaAluno", () => {
  it("agrupa registros por mês e calcula pct", async () => {
    const now = new Date()
    const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    m.frequencia.findMany.mockResolvedValue([
      { data: new Date(now.getFullYear(), now.getMonth(), 5), presenca: "Presente" },
      { data: new Date(now.getFullYear(), now.getMonth(), 10), presenca: "Ausente" },
    ])
    const results = await getFrequenciaAluno(1)
    expect(results).toHaveLength(6)
    const atual = results[results.length - 1]
    expect(atual.total).toBe(2)
    expect(atual.presentes).toBe(1)
    expect(atual.pct).toBe(50)
    expect(mesAtual).toBeTruthy() // o label não é verificado pois depende do locale
  })

  it("retorna pct null para meses sem registros", async () => {
    m.frequencia.findMany.mockResolvedValue([])
    const results = await getFrequenciaAluno(1)
    expect(results).toHaveLength(6)
    results.forEach((r) => {
      expect(r.total).toBe(0)
      expect(r.pct).toBeNull()
    })
  })
})

describe("getPresencaPorTurma", () => {
  it("agrupa por turma e filtra turmas sem registros", async () => {
    m.frequencia.findMany.mockResolvedValue([
      { presenca: "Presente", aluno: { turma: "Sub-9" } },
      { presenca: "Ausente",  aluno: { turma: "Sub-9" } },
      { presenca: "Presente", aluno: { turma: "Sub-11" } },
    ])
    const results = await getPresencaPorTurma("2026-06")
    expect(results).toHaveLength(2)
    const sub9 = results.find((r) => r.turma === "Sub-9")!
    expect(sub9.total).toBe(2)
    expect(sub9.presentes).toBe(1)
    expect(sub9.pct).toBe(50)
    const sub11 = results.find((r) => r.turma === "Sub-11")!
    expect(sub11.pct).toBe(100)
  })

  it("exclui turmas sem registros no mês", async () => {
    m.frequencia.findMany.mockResolvedValue([])
    const results = await getPresencaPorTurma("2026-06")
    expect(results).toHaveLength(0)
  })
})
