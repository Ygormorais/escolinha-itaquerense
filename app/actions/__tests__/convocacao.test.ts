import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    partida: { findUnique: vi.fn() },
    escalacaoJogador: { updateMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("@/lib/responsavel-session", () => ({
  getResponsavelSession: vi.fn().mockResolvedValue({ authenticated: true, responsavelId: 10 }),
}))
vi.mock("@/lib/push", () => ({ sendPushToResponsavel: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/convocacao", () => ({
  podeResponder: vi.fn().mockReturnValue(true),
  quemNotificar: vi.fn().mockReturnValue([10, 20]),
}))
vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { convocarEscalacao, responderConvocacao } from "@/app/actions/convocacao"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { podeResponder } from "@/lib/convocacao"

const m = db as unknown as {
  partida: { findUnique: ReturnType<typeof vi.fn> }
  escalacaoJogador: {
    updateMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

const partidaMock = {
  id: 1,
  data: new Date("2026-07-12"),
  adversario: "SC Cohab",
  local: "Casa",
  campeonatoId: 1,
  escalacao: [
    { id: 1, alunoId: 1, confirmacao: null, convocadoEm: null, aluno: { responsavelId: 10 } },
    { id: 2, alunoId: 2, confirmacao: null, convocadoEm: null, aluno: { responsavelId: 20 } },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  m.partida.findUnique.mockResolvedValue(partidaMock)
  m.escalacaoJogador.updateMany.mockResolvedValue({ count: 2 })
  m.escalacaoJogador.update.mockResolvedValue({})
})

describe("convocarEscalacao", () => {
  it("retorna erro se partida não encontrada", async () => {
    m.partida.findUnique.mockResolvedValueOnce(null)
    const res = await convocarEscalacao(99)
    expect(res).toEqual({ error: "Partida não encontrada." })
  })

  it("retorna erro se escalação vazia", async () => {
    m.partida.findUnique.mockResolvedValueOnce({ ...partidaMock, escalacao: [] })
    const res = await convocarEscalacao(1)
    expect(res).toEqual({ error: "Monte a escalação antes de convocar." })
  })

  it("convoca escalação com sucesso e retorna success", async () => {
    const res = await convocarEscalacao(1)
    expect(res).toEqual({ success: true })
  })

  it("marca convocadoEm em todos os jogadores", async () => {
    await convocarEscalacao(1)
    expect(m.escalacaoJogador.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { partidaId: 1 } })
    )
  })
})

describe("responderConvocacao", () => {
  const escalacaoMock = {
    convocadoEm: new Date(),
    partida: { data: new Date("2026-07-12") },
    aluno: { responsavelId: 10 },
  }

  beforeEach(() => {
    m.escalacaoJogador.findUnique.mockResolvedValue(escalacaoMock)
  })

  it("retorna erro se não autenticado", async () => {
    vi.mocked(getResponsavelSession).mockResolvedValueOnce({ authenticated: false })
    const res = await responderConvocacao(1, "confirmado")
    expect(res).toEqual({ error: "Não autenticado." })
  })

  it("retorna erro se resposta inválida", async () => {
    const res = await responderConvocacao(1, "talvez" as never)
    expect(res).toEqual({ error: "Resposta inválida." })
  })

  it("retorna erro se convocação não encontrada", async () => {
    m.escalacaoJogador.findUnique.mockResolvedValueOnce(null)
    const res = await responderConvocacao(99, "confirmado")
    expect(res).toEqual({ error: "Convocação não encontrada." })
  })

  it("retorna erro se convocadoEm é null (ainda não convocado)", async () => {
    m.escalacaoJogador.findUnique.mockResolvedValueOnce({ ...escalacaoMock, convocadoEm: null })
    const res = await responderConvocacao(1, "confirmado")
    expect(res).toEqual({ error: "Convocação não encontrada." })
  })

  it("retorna erro se responsável é diferente", async () => {
    m.escalacaoJogador.findUnique.mockResolvedValueOnce({
      ...escalacaoMock,
      aluno: { responsavelId: 99 },
    })
    const res = await responderConvocacao(1, "confirmado")
    expect(res).toEqual({ error: "Convocação não encontrada." })
  })

  it("retorna erro se prazo expirou", async () => {
    vi.mocked(podeResponder).mockReturnValueOnce(false)
    const res = await responderConvocacao(1, "confirmado")
    expect(res).toEqual({ error: "O prazo para responder já passou." })
  })

  it("confirma presença com sucesso", async () => {
    const res = await responderConvocacao(1, "confirmado")
    expect(res).toEqual({ success: true })
    expect(m.escalacaoJogador.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 }, data: expect.objectContaining({ confirmacao: "confirmado" }) })
    )
  })

  it("declina presença com sucesso", async () => {
    const res = await responderConvocacao(1, "ausente")
    expect(res).toEqual({ success: true })
    expect(m.escalacaoJogador.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ confirmacao: "ausente" }) })
    )
  })
})
