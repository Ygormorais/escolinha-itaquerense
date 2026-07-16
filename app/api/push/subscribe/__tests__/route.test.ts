import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: { pushSubscription: { upsert: vi.fn() } },
}))

vi.mock("@/lib/responsavel-session", () => ({
  getResponsavelSession: vi.fn(),
}))

import { POST } from "../route"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

const mockDb = db as unknown as { pushSubscription: { upsert: ReturnType<typeof vi.fn> } }
const mockSession = getResponsavelSession as ReturnType<typeof vi.fn>

const SESSION_OK = { authenticated: true, responsavelId: 7 }
const PAYLOAD = { endpoint: "https://push.example.com/sub/1", keys: { p256dh: "pk", auth: "ak" } }

function makeRequest(body: object) {
  return new Request("http://localhost/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSession.mockResolvedValue(SESSION_OK)
  mockDb.pushSubscription.upsert.mockResolvedValue({})
})

describe("POST /api/push/subscribe", () => {
  it("retorna 401 sem sessão", async () => {
    mockSession.mockResolvedValue({ authenticated: false })
    const res = await POST(makeRequest(PAYLOAD))
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem endpoint", async () => {
    const res = await POST(makeRequest({ keys: PAYLOAD.keys }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 sem keys", async () => {
    const res = await POST(makeRequest({ endpoint: PAYLOAD.endpoint }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 com JSON inválido", async () => {
    const res = await POST(new Request("http://localhost/api/push/subscribe", {
      method: "POST",
      body: "{",
    }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 com endpoint não seguro", async () => {
    const res = await POST(makeRequest({ ...PAYLOAD, endpoint: "http://push.example.com/sub/1" }))
    expect(res.status).toBe(400)
  })

  it("faz upsert e retorna ok: true", async () => {
    const res = await POST(makeRequest(PAYLOAD))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    expect(mockDb.pushSubscription.upsert).toHaveBeenCalledOnce()
    expect(mockDb.pushSubscription.upsert.mock.calls[0][0].create.responsavelId).toBe(7)
    expect(mockDb.pushSubscription.upsert.mock.calls[0][0].update.responsavelId).toBe(7)
  })
})
