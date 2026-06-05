import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    partida: { findUnique: vi.fn() },
    escalacaoJogador: { deleteMany: vi.fn(), createMany: vi.fn() },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { salvarEscalacao } from "@/app/actions/escalacao-partida"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const m = db as unknown as {
  partida: { findUnique: ReturnType<typeof vi.fn> }
  escalacaoJogador: { deleteMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.partida.findUnique.mockResolvedValue({ campeonatoId: 7 })
  m.escalacaoJogador.deleteMany.mockResolvedValue({})
  m.escalacaoJogador.createMany.mockResolvedValue({})
})

describe("salvarEscalacao", () => {
  it("exige autenticação", async () => {
    await salvarEscalacao(1, [{ alunoId: 1, posicao: "GOLEIRO" }])
    expect(requireAuth).toHaveBeenCalled()
  })

  it("substitui a escalação: deleteMany + createMany com os dados certos", async () => {
    const res = await salvarEscalacao(1, [
      { alunoId: 10, posicao: "GOLEIRO", numero: 1 },
      { alunoId: 11, posicao: "PIVO" },
    ])
    expect(res).toEqual({ success: true })
    expect(m.escalacaoJogador.deleteMany).toHaveBeenCalledWith({ where: { partidaId: 1 } })
    expect(m.escalacaoJogador.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ partidaId: 1, alunoId: 10, posicao: "GOLEIRO", numero: 1 }),
        expect.objectContaining({ partidaId: 1, alunoId: 11, posicao: "PIVO", numero: null }),
      ],
    })
  })

  it("rejeita escalação inválida sem tocar no banco", async () => {
    const res = await salvarEscalacao(1, [
      { alunoId: 10, posicao: "PIVO" },
      { alunoId: 11, posicao: "PIVO" },
    ])
    expect(res).toEqual({ error: expect.any(String) })
    expect(m.escalacaoJogador.deleteMany).not.toHaveBeenCalled()
    expect(m.escalacaoJogador.createMany).not.toHaveBeenCalled()
  })

  it("não chama createMany quando a escalação é vazia", async () => {
    const res = await salvarEscalacao(1, [])
    expect(res).toEqual({ success: true })
    expect(m.escalacaoJogador.deleteMany).toHaveBeenCalledWith({ where: { partidaId: 1 } })
    expect(m.escalacaoJogador.createMany).not.toHaveBeenCalled()
  })
})
