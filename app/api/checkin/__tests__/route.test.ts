import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    aluno: { findFirst: vi.fn() },
    frequencia: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ ok: true }),
}))

vi.mock("@/lib/rate-limit-response", () => ({
  rateLimitResponse: vi.fn().mockReturnValue(
    new Response(JSON.stringify({ error: "rate limited" }), { status: 429 })
  ),
}))

import { GET } from "../route"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"

const mockDb = db as unknown as {
  aluno: { findFirst: ReturnType<typeof vi.fn> }
  frequencia: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
}
const mockRateLimit = checkRateLimit as ReturnType<typeof vi.fn>

function makeRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/checkin")
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new Request(url, { headers: { "x-forwarded-for": "1.2.3.4" } })
}

const ALUNO = { id: 1, nome: "João Silva" }

beforeEach(() => {
  vi.clearAllMocks()
  mockRateLimit.mockReturnValue({ ok: true })
  mockDb.aluno.findFirst.mockResolvedValue(ALUNO)
  mockDb.frequencia.findFirst.mockResolvedValue(null)
  mockDb.frequencia.create.mockResolvedValue({})
})

describe("GET /api/checkin", () => {
  it("retorna 400 quando token ausente", async () => {
    const res = await GET(makeRequest({}) as any)
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando data no token é malformada", async () => {
    const res = await GET(makeRequest({ token: "Sub-13:20260624" }) as any)
    expect(res.status).toBe(400)
  })

  it("sem alunoId: redireciona para página de seleção", async () => {
    const res = await GET(makeRequest({ token: "Sub-13:2026-06-24" }) as any)
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("/checkin?token=Sub-13:2026-06-24")
    expect(res.headers.get("location")).not.toContain("alunoId")
  })

  it("registra presença e redireciona com ok=1", async () => {
    const res = await GET(makeRequest({ token: "Sub-13:2026-06-24", alunoId: "1" }) as any)
    expect(mockDb.frequencia.create).toHaveBeenCalledOnce()
    expect(res.status).toBe(307)
    expect(res.headers.get("location")).toContain("ok=1")
    expect(res.headers.get("location")).not.toContain("ja=1")
  })

  it("redireciona com ja=1 quando presença já registrada", async () => {
    mockDb.frequencia.findFirst.mockResolvedValue({ id: 99 })
    const res = await GET(makeRequest({ token: "Sub-13:2026-06-24", alunoId: "1" }) as any)
    expect(mockDb.frequencia.create).not.toHaveBeenCalled()
    expect(res.headers.get("location")).toContain("ja=1")
  })

  it("redireciona com erro=aluno quando aluno não encontrado na turma", async () => {
    mockDb.aluno.findFirst.mockResolvedValue(null)
    const res = await GET(makeRequest({ token: "Sub-13:2026-06-24", alunoId: "99" }) as any)
    expect(res.headers.get("location")).toContain("erro=aluno")
  })

  it("retorna 429 quando rate limit excedido", async () => {
    mockRateLimit.mockReturnValue({ ok: false, retryAfterMs: 60_000 })
    const res = await GET(makeRequest({ token: "Sub-13:2026-06-24" }) as any)
    expect(res.status).toBe(429)
  })
})
