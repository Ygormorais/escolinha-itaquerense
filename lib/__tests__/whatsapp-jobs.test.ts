import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    pagamento: { findMany: vi.fn() },
    whatsAppMensagem: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(),
}))

vi.mock("@/lib/whatsapp/provider", () => ({
  getWhatsAppProvider: vi.fn(),
}))

import { runEnviarLembretesWhatsAppInadimplencia } from "../whatsapp-jobs"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"

const mockDb = db as unknown as {
  pagamento: { findMany: ReturnType<typeof vi.fn> }
  whatsAppMensagem: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
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
  mockDb.whatsAppMensagem.create.mockResolvedValue({})
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
    mockDb.whatsAppMensagem.findFirst.mockResolvedValue({ createdAt: tresAtraso })
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
    mockDb.whatsAppMensagem.findFirst.mockResolvedValue({ createdAt: oitoAtraso })
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
