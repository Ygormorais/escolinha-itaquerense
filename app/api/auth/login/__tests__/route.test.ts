import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/session", () => ({
  checkCredentials: vi.fn(),
  createSession: vi.fn(),
  cookieName: vi.fn().mockReturnValue("escolinha_session"),
  cookieMaxAge: vi.fn().mockReturnValue(86400),
}))

vi.mock("@/app/actions/usuarios", () => ({
  checkDbCredentials: vi.fn(),
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ ok: true }),
}))

vi.mock("@/lib/rate-limit-response", () => ({
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: "rate limited" }), { status: 429 })
  ),
}))

import { POST } from "../route"
import { checkCredentials, createSession } from "@/lib/session"
import { checkDbCredentials } from "@/app/actions/usuarios"
import { checkRateLimit } from "@/lib/rate-limit"
import { INVALID_CREDENTIALS_MESSAGE } from "@/lib/auth-messages"

const mockCheckCredentials = checkCredentials as ReturnType<typeof vi.fn>
const mockCreateSession = createSession as ReturnType<typeof vi.fn>
const mockCheckDb = checkDbCredentials as ReturnType<typeof vi.fn>
const mockRateLimit = checkRateLimit as ReturnType<typeof vi.fn>

function makeRequest(body: object) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRateLimit.mockReturnValue({ ok: true })
  mockCreateSession.mockResolvedValue("session-token-abc")
  mockCheckDb.mockResolvedValue({ ok: false })
  mockCheckCredentials.mockReturnValue(false)
})

describe("POST /api/auth/login", () => {
  it("retorna 401 para credenciais inválidas", async () => {
    const res = await POST(makeRequest({ username: "wrong", password: "bad" }))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe(INVALID_CREDENTIALS_MESSAGE)
  })

  it("autentica via DB e seta cookie com role correto", async () => {
    mockCheckDb.mockResolvedValue({ ok: true, role: "secretaria" })
    const res = await POST(makeRequest({ username: "sec", password: "pass" }))
    expect(res.status).toBe(200)
    expect(mockCreateSession).toHaveBeenCalledWith("sec", "secretaria")
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("autentica via env como admin quando DB falha mas env é válido", async () => {
    mockCheckDb.mockResolvedValue({ ok: false })
    mockCheckCredentials.mockReturnValue(true)
    const res = await POST(makeRequest({ username: "admin", password: "secret" }))
    expect(res.status).toBe(200)
    expect(mockCreateSession).toHaveBeenCalledWith("admin", "admin")
  })

  it("retorna 429 quando rate limit excedido", async () => {
    mockRateLimit.mockReturnValue({ ok: false, retryAfterMs: 60_000 })
    const res = await POST(makeRequest({ username: "x", password: "y" }))
    expect(res.status).toBe(429)
  })

  it("cookie tem flags httpOnly e path=/", async () => {
    mockCheckDb.mockResolvedValue({ ok: true, role: "admin" })
    const res = await POST(makeRequest({ username: "admin", password: "pass" }))
    const setCookie = res.headers.get("set-cookie") ?? ""
    expect(setCookie).toContain("HttpOnly")
    expect(setCookie).toContain("Path=/")
  })
})
