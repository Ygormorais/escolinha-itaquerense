import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    aulaExperimental: { findMany: vi.fn(), update: vi.fn() },
    whatsAppMensagem: { create: vi.fn() },
  },
}))
vi.mock("@/lib/config", () => ({ getConfig: vi.fn(() => ({ nome: "E.C. Itaquerense", modelosMensagem: undefined })) }))
vi.mock("@/lib/mailer", () => ({ enviarEmail: vi.fn(), getErroConfiguracaoEmail: vi.fn() }))
vi.mock("@/lib/whatsapp/provider", () => ({ getWhatsAppProvider: vi.fn() }))
vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }))

import { runEnviarLembretesAulaExperimental } from "@/lib/aula-experimental-jobs"
import { db } from "@/lib/db"
import { enviarEmail, getErroConfiguracaoEmail } from "@/lib/mailer"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"

const m = db as unknown as {
  aulaExperimental: { findMany: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  whatsAppMensagem: { create: ReturnType<typeof vi.fn> }
}
const sendText = vi.fn()

const aula = (extra: Record<string, unknown> = {}) => ({
  id: 1,
  nomeAtleta: "Davi Souza",
  nomeResponsavel: "Maria Souza",
  telefone: "11999998888",
  email: "maria@email.com",
  status: "agendada",
  lembreteEnviadoEm: null,
  janela: { turma: "Sub-11", data: "2026-11-25", hora: "09:00", local: "Quadra 1" },
  ...extra,
})

const AGORA = new Date("2026-11-24T12:00:00-03:00")

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.stubEnv("EVOLUTION_API_KEY", "")
  m.aulaExperimental.findMany.mockResolvedValue([aula()])
  m.whatsAppMensagem.create.mockResolvedValue({})
  vi.mocked(getErroConfiguracaoEmail).mockReturnValue(null)
  vi.mocked(getWhatsAppProvider).mockReturnValue({ sendText, sendTemplate: vi.fn() } as never)
  sendText.mockResolvedValue({ success: true })
})

describe("lembrete da véspera da aula experimental", () => {
  it("busca as aulas agendadas de amanhã ainda sem lembrete", async () => {
    await runEnviarLembretesAulaExperimental(AGORA)
    expect(m.aulaExperimental.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "agendada", lembreteEnviadoEm: null, janela: { data: "2026-11-25" } },
      }),
    )
  })

  it("envia WhatsApp e e-mail quando os dois estão configurados e marca o lembrete", async () => {
    vi.stubEnv("EVOLUTION_API_KEY", "chave")
    const r = await runEnviarLembretesAulaExperimental(AGORA)
    expect(r).toEqual({ candidatas: 1, whatsapp: 1, email: 1, semCanal: 0, erros: 0 })
    expect(sendText).toHaveBeenCalledWith({ telefone: "5511999998888", mensagem: expect.stringContaining("Olá, Maria!") })
    expect(enviarEmail).toHaveBeenCalledWith("maria@email.com", expect.stringContaining("amanhã"), expect.stringContaining("Davi Souza"))
    expect(m.aulaExperimental.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { lembreteEnviadoEm: expect.any(Date) } })
  })

  it("não quebra quando nada está configurado: conta semCanal e não marca como lembrado", async () => {
    vi.mocked(getErroConfiguracaoEmail).mockReturnValue("SMTP não configurado")
    const r = await runEnviarLembretesAulaExperimental(AGORA)
    expect(r).toEqual({ candidatas: 1, whatsapp: 0, email: 0, semCanal: 1, erros: 0 })
    expect(sendText).not.toHaveBeenCalled()
    expect(enviarEmail).not.toHaveBeenCalled()
    expect(m.aulaExperimental.update).not.toHaveBeenCalled()
  })

  it("usa só o e-mail quando o WhatsApp não está configurado", async () => {
    const r = await runEnviarLembretesAulaExperimental(AGORA)
    expect(r).toMatchObject({ whatsapp: 0, email: 1, semCanal: 0 })
    expect(m.aulaExperimental.update).toHaveBeenCalled()
  })

  it("segue o ciclo e conta erro quando o WhatsApp falha, mas o e-mail entrega", async () => {
    vi.stubEnv("EVOLUTION_API_KEY", "chave")
    sendText.mockRejectedValue(new Error("fora do ar"))
    const r = await runEnviarLembretesAulaExperimental(AGORA)
    expect(r).toEqual({ candidatas: 1, whatsapp: 0, email: 1, semCanal: 0, erros: 1 })
    expect(m.aulaExperimental.update).toHaveBeenCalled()
  })

  it("sem e-mail da família e sem WhatsApp, tenta de novo no próximo ciclo", async () => {
    m.aulaExperimental.findMany.mockResolvedValue([aula({ email: null })])
    const r = await runEnviarLembretesAulaExperimental(AGORA)
    expect(r.semCanal).toBe(1)
    expect(m.aulaExperimental.update).not.toHaveBeenCalled()
  })

  it("não faz nada sem aulas amanhã", async () => {
    m.aulaExperimental.findMany.mockResolvedValue([])
    expect(await runEnviarLembretesAulaExperimental(AGORA)).toEqual({ candidatas: 0, whatsapp: 0, email: 0, semCanal: 0, erros: 0 })
  })
})
