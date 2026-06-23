import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    pagamento: { findMany: vi.fn() },
    whatsAppMensagem: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() },
  },
}))

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(),
}))

vi.mock("@/lib/whatsapp/provider", () => ({
  getWhatsAppProvider: vi.fn(),
}))

import {
  runEnviarLembretesWhatsAppInadimplencia,
  runEnviarLembretesWhatsAppVencendo,
} from "../whatsapp-jobs"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"

const mockDb = db as unknown as {
  pagamento: { findMany: ReturnType<typeof vi.fn> }
  whatsAppMensagem: {
    findFirst: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
}

const mockGetConfig = getConfig as ReturnType<typeof vi.fn>
const mockGetProvider = getWhatsAppProvider as ReturnType<typeof vi.fn>

function makePagamento(overrides: { alunoId?: number; mesReferencia?: string; telefone?: string } = {}) {
  const alunoId = overrides.alunoId ?? 1
  return {
    id: Math.random(),
    mesReferencia: overrides.mesReferencia ?? "Junho/2025",
    dataVencimento: new Date("2025-06-10"),
    aluno: {
      id: alunoId,
      nome: "João Silva",
      responsavel: "Maria Silva",
      telefone: overrides.telefone ?? "11999999999",
      mensalidade: 150,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetConfig.mockReturnValue({ intervaloDiasLembreteInadimplencia: 7, chavePix: "" })
  mockGetProvider.mockReturnValue({ sendText: vi.fn().mockResolvedValue({}) })
  mockDb.whatsAppMensagem.findFirst.mockResolvedValue(null)
  mockDb.whatsAppMensagem.findMany.mockResolvedValue([])
  mockDb.whatsAppMensagem.create.mockResolvedValue({})
})

function venc(over: { alunoId?: number; telefone?: string } = {}) {
  return {
    id: 1,
    mesReferencia: "2026-07",
    dataVencimento: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    aluno: {
      id: over.alunoId ?? 1,
      nome: "João Silva",
      responsavel: "Maria Silva",
      telefone: over.telefone ?? "11999999999",
      mensalidade: 150,
    },
  }
}

describe("runEnviarLembretesWhatsAppVencendo", () => {
  it("envia e registra o lembrete (origem lembrete-vencimento) quando não houve envio recente", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([venc()])
    // findMany para dedup retorna [] = sem envio anterior
    mockDb.whatsAppMensagem.findMany.mockResolvedValue([])
    const res = await runEnviarLembretesWhatsAppVencendo()
    expect(res.enviados).toBe(1)
    expect(mockDb.whatsAppMensagem.create).toHaveBeenCalledTimes(1)
    expect(mockDb.whatsAppMensagem.create.mock.calls[0][0].data.origem).toBe("lembrete-vencimento")
  })

  it("pula (dedup) quando já avisou o aluno nos últimos dias, sem reenviar", async () => {
    const send = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText: send })
    const alunoId = 1
    mockDb.pagamento.findMany.mockResolvedValue([venc({ alunoId })])
    // findMany retorna envio recente (ontem)
    mockDb.whatsAppMensagem.findMany.mockResolvedValue([
      { alunoId, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    ])
    const res = await runEnviarLembretesWhatsAppVencendo()
    expect(res.enviados).toBe(0)
    expect(send).not.toHaveBeenCalled()
    expect(mockDb.whatsAppMensagem.create).not.toHaveBeenCalled()
  })

  it("não conta erro de envio como enviado", async () => {
    mockGetProvider.mockReturnValue({ sendText: vi.fn().mockRejectedValue(new Error("falhou")) })
    mockDb.pagamento.findMany.mockResolvedValue([venc()])
    mockDb.whatsAppMensagem.findMany.mockResolvedValue([])
    const res = await runEnviarLembretesWhatsAppVencendo()
    expect(res.enviados).toBe(0)
    expect(res.erros).toBe(1)
  })
})

describe("runEnviarLembretesWhatsAppInadimplencia", () => {
  it("envia 1 mensagem para aluno com 1 mês em atraso", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento()])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).toHaveBeenCalledTimes(1)
    expect(result.enviados).toBe(1)
    expect(result.pulados).toBe(0)
  })

  it("envia 1 mensagem consolidada para aluno com 3 meses em atraso", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([
      makePagamento({ alunoId: 1, mesReferencia: "Abril/2025" }),
      makePagamento({ alunoId: 1, mesReferencia: "Maio/2025" }),
      makePagamento({ alunoId: 1, mesReferencia: "Junho/2025" }),
    ])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).toHaveBeenCalledTimes(1)
    const msgEnviada = sendText.mock.calls[0][0].mensagem as string
    expect(msgEnviada).toContain("Abril/2025")
    expect(msgEnviada).toContain("Maio/2025")
    expect(msgEnviada).toContain("Junho/2025")
    expect(result.enviados).toBe(1)
  })

  it("pula aluno notificado há 3 dias quando intervalo é 7", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento()])
    const tresAtraso = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    mockDb.whatsAppMensagem.findMany.mockResolvedValue([{ alunoId: 1, createdAt: tresAtraso }])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).not.toHaveBeenCalled()
    expect(result.pulados).toBe(1)
    expect(result.enviados).toBe(0)
  })

  it("envia para aluno notificado há 8 dias quando intervalo é 7", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento()])
    const oitoAtraso = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    mockDb.whatsAppMensagem.findMany.mockResolvedValue([{ alunoId: 1, createdAt: oitoAtraso }])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).toHaveBeenCalledTimes(1)
    expect(result.enviados).toBe(1)
  })

  it("conta semTelefone para aluno sem telefone e não envia", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento({ telefone: "" })])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    const result = await runEnviarLembretesWhatsAppInadimplencia()

    expect(sendText).not.toHaveBeenCalled()
    expect(result.semTelefone).toBe(1)
    expect(result.enviados).toBe(0)
  })

  it("grava registro em WhatsAppMensagem após envio bem-sucedido", async () => {
    mockDb.pagamento.findMany.mockResolvedValue([makePagamento()])
    const sendText = vi.fn().mockResolvedValue({})
    mockGetProvider.mockReturnValue({ sendText })

    await runEnviarLembretesWhatsAppInadimplencia()

    expect(mockDb.whatsAppMensagem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          alunoId: 1,
          origem: "lembrete-inadimplencia",
        }),
      })
    )
  })
})
