import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    chatSession: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import {
  appendHistory,
  blockSession,
  createSession,
  getSession,
  identifySession,
  unblockSession,
} from "@/lib/whatsapp/session"
import { db } from "@/lib/db"

const cs = (db as unknown as {
  chatSession: Record<"findUnique" | "delete" | "upsert" | "update", ReturnType<typeof vi.fn>>
}).chatSession

const AGORA = new Date("2026-10-09T12:00:00Z")
const EM_24H = new Date("2026-10-10T12:00:00Z")
const TELEFONE = "11999887766"

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(AGORA)
  cs.update.mockResolvedValue({})
})

afterEach(() => {
  vi.useRealTimers()
})

describe("getSession", () => {
  it("retorna null quando não existe sessão", async () => {
    cs.findUnique.mockResolvedValue(null)
    expect(await getSession(TELEFONE)).toBeNull()
  })

  it("retorna a sessão ainda válida", async () => {
    const sessao = { telefone: TELEFONE, expiresAt: EM_24H }
    cs.findUnique.mockResolvedValue(sessao)

    expect(await getSession(TELEFONE)).toBe(sessao)
    expect(cs.delete).not.toHaveBeenCalled()
  })

  it("apaga e ignora a sessão expirada", async () => {
    cs.findUnique.mockResolvedValue({ telefone: TELEFONE, expiresAt: new Date("2026-10-09T11:59:59Z") })

    expect(await getSession(TELEFONE)).toBeNull()
    expect(cs.delete).toHaveBeenCalledWith({ where: { telefone: TELEFONE } })
  })
})

describe("createSession", () => {
  it("cria ou reinicia a sessão com validade de 24 horas", async () => {
    await createSession(TELEFONE)

    expect(cs.upsert).toHaveBeenCalledWith({
      where: { telefone: TELEFONE },
      create: { telefone: TELEFONE, expiresAt: EM_24H },
      update: { expiresAt: EM_24H, identificado: false, bloqueado: false, historico: "[]" },
    })
  })
})

describe("identifySession", () => {
  it("vincula o responsável e renova a validade", async () => {
    await identifySession(TELEFONE, 7)

    expect(cs.update).toHaveBeenCalledWith({
      where: { telefone: TELEFONE },
      data: { responsavelId: 7, identificado: true, expiresAt: EM_24H },
    })
  })
})

describe("appendHistory", () => {
  it("ignora silenciosamente quando a sessão não existe", async () => {
    cs.findUnique.mockResolvedValue(null)

    expect(await appendHistory(TELEFONE, "user", "oi")).toBe(false)
    expect(cs.update).not.toHaveBeenCalled()
  })

  it("acrescenta a mensagem e renova a validade", async () => {
    cs.findUnique.mockResolvedValue({ historico: JSON.stringify([{ role: "user", content: "oi" }]) })

    expect(await appendHistory(TELEFONE, "assistant", "Olá!")).toBe(true)
    expect(cs.update).toHaveBeenCalledWith({
      where: { telefone: TELEFONE },
      data: {
        historico: JSON.stringify([
          { role: "user", content: "oi" },
          { role: "assistant", content: "Olá!" },
        ]),
        expiresAt: EM_24H,
      },
    })
  })

  it("mantém só as 10 mensagens mais recentes", async () => {
    const antigas = Array.from({ length: 10 }, (_, i) => ({ role: "user", content: `m${i}` }))
    cs.findUnique.mockResolvedValue({ historico: JSON.stringify(antigas) })

    await appendHistory(TELEFONE, "user", "nova")

    const salvo = JSON.parse(cs.update.mock.calls[0][0].data.historico)
    expect(salvo).toHaveLength(10)
    expect(salvo[0].content).toBe("m1")
    expect(salvo.at(-1).content).toBe("nova")
  })

  it("recomeça o histórico quando o JSON salvo está corrompido", async () => {
    cs.findUnique.mockResolvedValue({ historico: "{quebrado" })

    await appendHistory(TELEFONE, "user", "oi")

    expect(JSON.parse(cs.update.mock.calls[0][0].data.historico)).toEqual([{ role: "user", content: "oi" }])
  })
})

describe("bloqueio", () => {
  it("bloqueia e desbloqueia a sessão", async () => {
    await blockSession(TELEFONE)
    await unblockSession(TELEFONE)

    expect(cs.update).toHaveBeenNthCalledWith(1, { where: { telefone: TELEFONE }, data: { bloqueado: true } })
    expect(cs.update).toHaveBeenNthCalledWith(2, { where: { telefone: TELEFONE }, data: { bloqueado: false } })
  })
})
