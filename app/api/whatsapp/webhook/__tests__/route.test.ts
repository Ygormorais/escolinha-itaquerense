import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    whatsAppMensagem: { findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/whatsapp/ai-router", () => ({ routeMessage: vi.fn().mockResolvedValue(undefined) }))

vi.mock("@/lib/env", () => ({
  getEvolutionApiKey: vi.fn(() => "key"),
  verifyEvolutionAuth: vi.fn(() => true),
}))

import { POST } from "@/app/api/whatsapp/webhook/route"
import { db } from "@/lib/db"
import { routeMessage } from "@/lib/whatsapp/ai-router"

const m = db as unknown as {
  whatsAppMensagem: {
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
}
const route = routeMessage as unknown as ReturnType<typeof vi.fn>

function reqWith(payload: unknown) {
  return { json: async () => payload } as unknown as Parameters<typeof POST>[0]
}

function mensagem(over: Record<string, unknown> = {}) {
  return {
    event: "MESSAGE",
    instance: "escolinha",
    data: {
      key: { remoteJid: "5511999998888@s.whatsapp.net", id: "msg-1", ...((over.key as object) ?? {}) },
      message: { conversation: "oi" },
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.whatsAppMensagem.findFirst.mockResolvedValue(null)
  m.whatsAppMensagem.create.mockResolvedValue({})
  m.whatsAppMensagem.updateMany.mockResolvedValue({ count: 0 })
})

describe("webhook WhatsApp", () => {
  it("ignora mensagens fromMe (evita loop de eco) — não grava nem roteia", async () => {
    await POST(reqWith(mensagem({ key: { remoteJid: "5511999998888@s.whatsapp.net", id: "msg-1", fromMe: true } })))
    expect(m.whatsAppMensagem.create).not.toHaveBeenCalled()
    expect(route).not.toHaveBeenCalled()
  })

  it("processa mensagem recebida normal (grava e roteia)", async () => {
    await POST(reqWith(mensagem()))
    expect(m.whatsAppMensagem.create).toHaveBeenCalled()
    expect(route).toHaveBeenCalledWith("5511999998888", "oi")
  })
})
