import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    resetToken: { findUnique: vi.fn(), update: vi.fn() },
    responsavel: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("bcryptjs", () => ({
  default: { hashSync: vi.fn().mockReturnValue("hashed-nova-senha") },
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
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"

const mockDb = db as unknown as {
  resetToken: { findUnique: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}
const mockRateLimit = checkRateLimit as ReturnType<typeof vi.fn>

const TOKEN_VALIDO = {
  id: 1,
  token: "tok-abc123",
  responsavelId: 5,
  usado: false,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
}

function makeRequest(body: object) {
  return new Request("http://localhost/api/responsavel/redefinir-senha", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRateLimit.mockReturnValue({ ok: true })
  mockDb.resetToken.findUnique.mockResolvedValue(TOKEN_VALIDO)
  mockDb.$transaction.mockResolvedValue([])
})

describe("POST /api/responsavel/redefinir-senha", () => {
  it("redefine senha com token válido", async () => {
    const res = await POST(makeRequest({ token: "tok-abc123", senha: "novaSenha123" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toMatch(/sucesso/i)
    expect(mockDb.$transaction).toHaveBeenCalledOnce()
  })

  it("retorna 400 para token ausente", async () => {
    const res = await POST(makeRequest({ senha: "novaSenha123" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 para senha menor que 6 caracteres", async () => {
    const res = await POST(makeRequest({ token: "tok-abc123", senha: "12345" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando token já foi usado", async () => {
    mockDb.resetToken.findUnique.mockResolvedValue({ ...TOKEN_VALIDO, usado: true })
    const res = await POST(makeRequest({ token: "tok-abc123", senha: "novaSenha123" }))
    expect(res.status).toBe(400)
    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it("retorna 400 quando token está expirado", async () => {
    mockDb.resetToken.findUnique.mockResolvedValue({
      ...TOKEN_VALIDO,
      expiresAt: new Date(Date.now() - 1000),
    })
    const res = await POST(makeRequest({ token: "tok-abc123", senha: "novaSenha123" }))
    expect(res.status).toBe(400)
    expect(mockDb.$transaction).not.toHaveBeenCalled()
  })

  it("retorna 400 quando token não existe no DB", async () => {
    mockDb.resetToken.findUnique.mockResolvedValue(null)
    const res = await POST(makeRequest({ token: "tok-invalido", senha: "novaSenha123" }))
    expect(res.status).toBe(400)
  })

  it("retorna 429 quando rate limit excedido", async () => {
    mockRateLimit.mockReturnValue({ ok: false, retryAfterMs: 60_000 })
    const res = await POST(makeRequest({ token: "tok-abc123", senha: "novaSenha123" }))
    expect(res.status).toBe(429)
  })
})
