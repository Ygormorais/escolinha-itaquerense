import { describe, it, expect, beforeEach, vi } from "vitest"

const tx = {
  escalacaoJogador: { deleteMany: vi.fn(), upsert: vi.fn() },
}

vi.mock("@/lib/db", () => ({
  db: {
    partida: { findUnique: vi.fn() },
    $transaction: vi.fn(async (fn: (t: unknown) => unknown) => fn(tx)),
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
}

beforeEach(() => {
  vi.clearAllMocks()
  m.partida.findUnique.mockResolvedValue({ campeonatoId: 7 })
  tx.escalacaoJogador.deleteMany.mockResolvedValue({})
  tx.escalacaoJogador.upsert.mockResolvedValue({})
})

describe("salvarEscalacao", () => {
  it("exige autenticação", async () => {
    await salvarEscalacao(1, [{ alunoId: 1, posicao: "GOLEIRO" }])
    expect(requireAuth).toHaveBeenCalled()
  })

  it("remove apenas quem saiu da escalação", async () => {
    await salvarEscalacao(1, [
      { alunoId: 10, posicao: "GOLEIRO", numero: 1 },
      { alunoId: 11, posicao: "PIVO" },
    ])
    expect(tx.escalacaoJogador.deleteMany).toHaveBeenCalledWith({
      where: { partidaId: 1, alunoId: { notIn: [10, 11] } },
    })
  })

  it("quem permanece é atualizado sem tocar nos campos de RSVP", async () => {
    const res = await salvarEscalacao(1, [{ alunoId: 10, posicao: "FIXO", numero: 4 }])
    expect(res).toEqual({ success: true })
    expect(tx.escalacaoJogador.upsert).toHaveBeenCalledWith({
      where: { partidaId_alunoId: { partidaId: 1, alunoId: 10 } },
      update: { posicao: "FIXO", numero: 4, ordem: 0 },
      create: expect.objectContaining({ partidaId: 1, alunoId: 10, posicao: "FIXO", numero: 4 }),
    })
    const { update } = tx.escalacaoJogador.upsert.mock.calls[0][0]
    expect(update).not.toHaveProperty("convocadoEm")
    expect(update).not.toHaveProperty("confirmacao")
    expect(update).not.toHaveProperty("respondidoEm")
  })

  it("quem entra é criado com RSVP zerado", async () => {
    await salvarEscalacao(1, [{ alunoId: 12, posicao: "ALA_ESQ" }])
    const { create } = tx.escalacaoJogador.upsert.mock.calls[0][0]
    expect(create).toMatchObject({ partidaId: 1, alunoId: 12, posicao: "ALA_ESQ", numero: null })
    expect(create.convocadoEm ?? null).toBeNull()
    expect(create.confirmacao ?? null).toBeNull()
  })

  it("rejeita escalação inválida sem tocar no banco", async () => {
    const res = await salvarEscalacao(1, [
      { alunoId: 10, posicao: "PIVO" },
      { alunoId: 11, posicao: "PIVO" },
    ])
    expect(res).toEqual({ error: expect.any(String) })
    expect(tx.escalacaoJogador.deleteMany).not.toHaveBeenCalled()
    expect(tx.escalacaoJogador.upsert).not.toHaveBeenCalled()
  })

  it("escalação vazia deleta todos e não faz upsert", async () => {
    const res = await salvarEscalacao(1, [])
    expect(res).toEqual({ success: true })
    expect(tx.escalacaoJogador.deleteMany).toHaveBeenCalledWith({
      where: { partidaId: 1, alunoId: { notIn: [] } },
    })
    expect(tx.escalacaoJogador.upsert).not.toHaveBeenCalled()
  })
})
