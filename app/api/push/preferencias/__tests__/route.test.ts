import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: { notificacaoPreferencia: { findUnique: vi.fn(), upsert: vi.fn() } },
}))

vi.mock("@/lib/responsavel-session", () => ({
  getResponsavelSession: vi.fn(),
}))

import { GET, PUT } from "../route"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

const mockDb = db as unknown as {
  notificacaoPreferencia: { findUnique: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> }
}
const mockSession = getResponsavelSession as ReturnType<typeof vi.fn>

const SESSION_OK = { authenticated: true, responsavelId: 3 }
const PREFS = { vencimento: true, pagamentoConfirmado: true, falta: false, convocacao: true, comunicado: false, avaliacao: true }

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.mockResolvedValue(SESSION_OK)
  mockDb.notificacaoPreferencia.findUnique.mockResolvedValue(PREFS)
  mockDb.notificacaoPreferencia.upsert.mockResolvedValue({})
})

describe("GET /api/push/preferencias", () => {
  it("retorna 401 sem sessão", async () => {
    mockSession.mockResolvedValue({ authenticated: false })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("retorna preferências existentes", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(PREFS)
  })

  it("retorna defaults quando não há preferências salvas", async () => {
    mockDb.notificacaoPreferencia.findUnique.mockResolvedValue(null)
    const res = await GET()
    const body = await res.json()
    expect(body.vencimento).toBe(true)
    expect(body.convocacao).toBe(true)
  })
})

describe("PUT /api/push/preferencias", () => {
  it("retorna 401 sem sessão", async () => {
    mockSession.mockResolvedValue({ authenticated: false })
    const res = await PUT(new Request("http://localhost", { method: "PUT", body: JSON.stringify(PREFS) }))
    expect(res.status).toBe(401)
  })

  it("faz upsert e retorna ok: true", async () => {
    const res = await PUT(new Request("http://localhost", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(PREFS),
    }))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    expect(mockDb.notificacaoPreferencia.upsert).toHaveBeenCalledOnce()
    expect(mockDb.notificacaoPreferencia.upsert.mock.calls[0][0].create.responsavelId).toBe(3)
  })
})
