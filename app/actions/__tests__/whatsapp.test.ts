import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    aluno: { findUnique: vi.fn(), findMany: vi.fn() },
    whatsAppMensagem: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/config", () => ({
  getConfig: vi.fn().mockReturnValue({ nome: "E.C. Itaquerense", chavePix: "pix@clube.com" }),
}))
vi.mock("@/lib/push", () => ({ sendPushToResponsavel: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/utils", () => ({ formatMoney: vi.fn((v: number) => `R$ ${v.toFixed(2)}`) }))
vi.mock("@/lib/whatsapp/provider", () => ({
  getWhatsAppProvider: vi.fn().mockReturnValue({
    sendText: vi.fn().mockResolvedValue({ success: true, messageId: "msg-1" }),
  }),
}))

import {
  enviarWhatsApp,
  enviarCobrancaWhatsApp,
  enviarComunicadoMassa,
  getHistoricoWhatsApp,
  marcarMensagemLida,
} from "@/app/actions/whatsapp"
import { db } from "@/lib/db"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"

const m = db as unknown as {
  aluno: { findUnique: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> }
  whatsAppMensagem: { create: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}

const providerMock = { sendText: vi.fn().mockResolvedValue({ success: true, messageId: "msg-1" }) }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getWhatsAppProvider).mockReturnValue(providerMock as never)
  providerMock.sendText.mockResolvedValue({ success: true, messageId: "msg-1" })
  m.aluno.findUnique.mockResolvedValue({ nome: "Lucas Oliveira", responsavel: "Maria Oliveira" })
  m.aluno.findMany.mockResolvedValue([])
  m.whatsAppMensagem.create.mockResolvedValue({})
  m.whatsAppMensagem.findMany.mockResolvedValue([])
  m.whatsAppMensagem.update.mockResolvedValue({})
})

describe("enviarWhatsApp", () => {
  it("envia mensagem e grava no histórico", async () => {
    const res = await enviarWhatsApp(1, "11987654321", "Olá!")
    expect(res).toEqual({ success: true })
    expect(providerMock.sendText).toHaveBeenCalledWith({ telefone: "11987654321", mensagem: "Olá!" })
    expect(m.whatsAppMensagem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ alunoId: 1, status: "sent", origem: "manual" }) })
    )
  })

  it("grava status 'failed' quando provider retorna failure", async () => {
    providerMock.sendText.mockResolvedValueOnce({ success: false })
    await enviarWhatsApp(1, "11987654321", "Olá!")
    expect(m.whatsAppMensagem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) })
    )
  })

  it("retorna erro se provider lançar exceção", async () => {
    providerMock.sendText.mockRejectedValueOnce(new Error("Sem conexão"))
    const res = await enviarWhatsApp(1, "11987654321", "Olá!")
    expect(res).toEqual({ error: "Sem conexão" })
  })
})

describe("enviarCobrancaWhatsApp", () => {
  it("retorna erro se aluno não encontrado", async () => {
    m.aluno.findUnique.mockResolvedValueOnce(null)
    const res = await enviarCobrancaWhatsApp(99, "11999999999", "2026-06", 150)
    expect(res).toEqual({ error: "Aluno não encontrado" })
    expect(providerMock.sendText).not.toHaveBeenCalled()
  })

  it("envia cobrança com nome do responsável", async () => {
    const res = await enviarCobrancaWhatsApp(1, "11987654321", "2026-06", 150)
    expect(res).toEqual({ success: true })
    const chamada = providerMock.sendText.mock.calls[0][0]
    expect(chamada.mensagem).toContain("Maria Oliveira")
    expect(chamada.mensagem).toContain("2026-06")
    expect(chamada.mensagem).toContain("R$")
  })

  it("inclui chave PIX na mensagem quando configurada", async () => {
    const res = await enviarCobrancaWhatsApp(1, "11987654321", "2026-06", 150)
    expect(res).toEqual({ success: true })
    const chamada = providerMock.sendText.mock.calls[0][0]
    expect(chamada.mensagem).toContain("pix@clube.com")
  })

  it("grava no histórico com origem 'cobranca'", async () => {
    await enviarCobrancaWhatsApp(1, "11987654321", "2026-06", 150)
    expect(m.whatsAppMensagem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ origem: "cobranca" }) })
    )
  })
})

describe("enviarComunicadoMassa", () => {
  it("retorna zeros se não houver alunos ativos", async () => {
    m.aluno.findMany.mockResolvedValue([])
    const res = await enviarComunicadoMassa("Reunião amanhã!", "Todas")
    expect(res).toEqual({ enviados: 0, erros: 0, semTelefone: 0 })
  })

  it("conta alunos sem telefone separadamente", async () => {
    m.aluno.findMany
      .mockResolvedValueOnce([
        { id: 1, nome: "Lucas", telefone: null },
        { id: 2, nome: "Gabriel", telefone: "119" }, // muito curto
      ])
      .mockResolvedValueOnce([]) // responsáveis para push
    const res = await enviarComunicadoMassa("Aviso", "Todas")
    expect(res).toEqual({ enviados: 0, erros: 0, semTelefone: 2 })
  })

  it("substitui {nome} na mensagem", async () => {
    m.aluno.findMany
      .mockResolvedValueOnce([{ id: 1, nome: "Lucas", telefone: "11987654321" }])
      .mockResolvedValueOnce([{ responsavelId: 10 }])
    await enviarComunicadoMassa("Olá, {nome}!", "Todas")
    expect(providerMock.sendText).toHaveBeenCalledWith(
      expect.objectContaining({ mensagem: "Olá, Lucas!" })
    )
  })

  it("conta erros quando provider falha para um aluno", async () => {
    m.aluno.findMany
      .mockResolvedValueOnce([
        { id: 1, nome: "Lucas", telefone: "11987654321" },
        { id: 2, nome: "Gabriel", telefone: "11976543210" },
      ])
      .mockResolvedValueOnce([])
    providerMock.sendText
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error("Falha"))
    const res = await enviarComunicadoMassa("Aviso", "Todas")
    expect(res).toEqual({ enviados: 1, erros: 1, semTelefone: 0 })
  })
})

describe("getHistoricoWhatsApp", () => {
  it("busca histórico do aluno", async () => {
    const mock = [{ id: 1, mensagem: "Olá" }]
    m.whatsAppMensagem.findMany.mockResolvedValueOnce(mock)
    const res = await getHistoricoWhatsApp(1)
    expect(res).toEqual(mock)
    expect(m.whatsAppMensagem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { alunoId: 1 } })
    )
  })
})

describe("marcarMensagemLida", () => {
  it("marca mensagem como lida", async () => {
    await marcarMensagemLida(5)
    expect(m.whatsAppMensagem.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 }, data: expect.objectContaining({ lida: true }) })
    )
  })
})
