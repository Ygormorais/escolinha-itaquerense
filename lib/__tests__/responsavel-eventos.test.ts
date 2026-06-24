import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    escalacaoJogador: { findMany: vi.fn() },
    evento: { findMany: vi.fn() },
  },
}))

import { buscarProximosEventos } from "../responsavel-eventos"
import { db } from "@/lib/db"

const mockDb = db as unknown as {
  escalacaoJogador: { findMany: ReturnType<typeof vi.fn> }
  evento: { findMany: ReturnType<typeof vi.fn> }
}

function futura(dias: number) {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.escalacaoJogador.findMany.mockResolvedValue([])
  mockDb.evento.findMany.mockResolvedValue([])
})

describe("buscarProximosEventos", () => {
  it("retorna lista vazia quando não há convocações nem eventos", async () => {
    const res = await buscarProximosEventos(1, ["Sub-13"])
    expect(res).toEqual([])
  })

  it("mapeia convocação como tipo jogo com adversario e nome do aluno", async () => {
    mockDb.escalacaoJogador.findMany.mockResolvedValue([{
      id: 1,
      confirmacao: "confirmado",
      aluno: { nome: "João" },
      partida: { data: futura(2), adversario: "Rivais FC" },
    }])
    const res = await buscarProximosEventos(1, ["Sub-13"])
    expect(res[0]).toMatchObject({
      tipo: "jogo",
      titulo: "Jogo vs Rivais FC",
      alunoNome: "João",
      confirmacao: "confirmado",
    })
  })

  it("mapeia evento geral como tipo evento", async () => {
    mockDb.evento.findMany.mockResolvedValue([{
      id: 2,
      titulo: "Festa de encerramento",
      data: futura(5),
      turmas: "Todas",
      status: "ativo",
      tipo: "Festa",
    }])
    const res = await buscarProximosEventos(1, ["Sub-13"])
    expect(res[0]).toMatchObject({ tipo: "evento", titulo: "Festa de encerramento" })
  })

  it("filtra evento por turma — inclui turma compatível", async () => {
    mockDb.evento.findMany.mockResolvedValue([{
      id: 3,
      titulo: "Treino especial Sub-13",
      data: futura(3),
      turmas: "Sub-13, Sub-15",
      status: "ativo",
      tipo: "Treino",
    }])
    const res = await buscarProximosEventos(1, ["Sub-13"])
    expect(res).toHaveLength(1)
  })

  it("filtra evento por turma — exclui turma diferente", async () => {
    mockDb.evento.findMany.mockResolvedValue([{
      id: 4,
      titulo: "Treino Sub-7",
      data: futura(3),
      turmas: "Sub-7",
      status: "ativo",
      tipo: "Treino",
    }])
    const res = await buscarProximosEventos(1, ["Sub-13"])
    expect(res).toHaveLength(0)
  })

  it("limita resultado a 3 itens ordenados por data", async () => {
    const convs = [3, 1, 5, 2].map((dias, i) => ({
      id: i,
      confirmacao: null,
      aluno: { nome: `Aluno ${i}` },
      partida: { data: futura(dias), adversario: "Time X" },
    }))
    mockDb.escalacaoJogador.findMany.mockResolvedValue(convs)

    const res = await buscarProximosEventos(1, [])
    expect(res).toHaveLength(3)
    // primeiro deve ser o mais próximo
    const datas = res.map((r) => new Date(r.data).getTime())
    expect(datas[0]).toBeLessThan(datas[1])
    expect(datas[1]).toBeLessThan(datas[2])
  })
})
