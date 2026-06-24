import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: { responsavel: { findUnique: vi.fn() } },
}))

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}))

vi.mock("@/lib/responsavel-session", () => ({
  createResponsavelSession: vi.fn().mockResolvedValue("resp-token"),
  responsavelCookieName: vi.fn().mockReturnValue("resp_session"),
  responsavelCookieMaxAge: vi.fn().mockReturnValue(86400),
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
import bcrypt from "bcryptjs"
import { checkRateLimit } from "@/lib/rate-limit"

const mockDb = db as unknown as { responsavel: { findUnique: ReturnType<typeof vi.fn> } }
const mockBcrypt = bcrypt as unknown as { compare: ReturnType<typeof vi.fn> }
const mockRateLimit = checkRateLimit as ReturnType<typeof vi.fn>

function makeRequest(body: object) {
  return new Request("http://localhost/api/responsavel/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify(body),
  })
}

const RESPONSAVEL = { id: 1, nome: "Maria", email: "maria@email.com", senha: "hashed", ativo: true }

beforeEach(() => {
  vi.clearAllMocks()
  mockRateLimit.mockReturnValue({ ok: true })
  mockDb.responsavel.findUnique.mockResolvedValue(RESPONSAVEL)
  mockBcrypt.compare.mockResolvedValue(true)
})

describe("POST /api/responsavel/auth", () => {
  it("retorna 200 e nome para credenciais válidas", async () => {
    const res = await POST(makeRequest({ email: "maria@email.com", senha: "correta" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.nome).toBe("Maria")
  })

  it("retorna 401 quando responsavel não existe", async () => {
    mockDb.responsavel.findUnique.mockResolvedValue(null)
    const res = await POST(makeRequest({ email: "nao@existe.com", senha: "x" }))
    expect(res.status).toBe(401)
  })

  it("retorna 401 quando conta está inativa", async () => {
    mockDb.responsavel.findUnique.mockResolvedValue({ ...RESPONSAVEL, ativo: false })
    const res = await POST(makeRequest({ email: "maria@email.com", senha: "correta" }))
    expect(res.status).toBe(401)
  })

  it("retorna 401 quando senha incorreta", async () => {
    mockBcrypt.compare.mockResolvedValue(false)
    const res = await POST(makeRequest({ email: "maria@email.com", senha: "errada" }))
    expect(res.status).toBe(401)
  })

  it("normaliza email para lowercase antes da busca", async () => {
    await POST(makeRequest({ email: "MARIA@EMAIL.COM", senha: "correta" }))
    expect(mockDb.responsavel.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "maria@email.com" } })
    )
  })

  it("retorna 429 quando rate limit excedido", async () => {
    mockRateLimit.mockReturnValue({ ok: false, retryAfterMs: 60_000 })
    const res = await POST(makeRequest({ email: "maria@email.com", senha: "x" }))
    expect(res.status).toBe(429)
  })
})
