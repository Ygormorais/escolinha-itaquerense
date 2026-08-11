import { beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

vi.mock("@/lib/db", () => ({
  db: {
    aluno: { findFirst: vi.fn() },
    frequencia: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}))

vi.mock("@/lib/checkin-token", () => ({
  verifyCheckinToken: vi.fn(),
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
import { verifyCheckinToken } from "@/lib/checkin-token"
import { checkRateLimit } from "@/lib/rate-limit"

const mockDb = db as unknown as {
  aluno: { findFirst: ReturnType<typeof vi.fn> }
  frequencia: { findUnique: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> }
}
const mockVerifyToken = verifyCheckinToken as ReturnType<typeof vi.fn>
const mockRateLimit = checkRateLimit as ReturnType<typeof vi.fn>

function makeRequest(data: Record<string, string>) {
  return new Request("http://localhost/api/checkin", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      "x-forwarded-for": "1.2.3.4",
    },
    body: new URLSearchParams(data),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRateLimit.mockReturnValue({ ok: true })
  mockVerifyToken.mockReturnValue({ turma: "Sub-13", data: "2026-06-24" })
  mockDb.aluno.findFirst.mockResolvedValue({ id: 1, dataNascimento: new Date("2015-06-15T12:00:00.000Z") })
  mockDb.frequencia.findUnique.mockResolvedValue(null)
  mockDb.frequencia.upsert.mockResolvedValue({ id: 10 })
})

describe("POST /api/checkin", () => {
  it("rejeita token inválido sem consultar alunos", async () => {
    mockVerifyToken.mockReturnValue(null)
    const res = await POST(makeRequest({ token: "legado", matricula: "1", dataNascimento: "2015-06-15" }) as unknown as NextRequest)

    expect(res.status).toBe(400)
    expect(mockDb.aluno.findFirst).not.toHaveBeenCalled()
  })

  it("usa matrícula, turma e nascimento para identificar o aluno", async () => {
    const res = await POST(makeRequest({ token: "assinado", matricula: "000001", dataNascimento: "2015-06-15" }) as unknown as NextRequest)

    expect(mockDb.aluno.findFirst).toHaveBeenCalledWith({
      where: { id: 1, turma: "Sub-13", status: "Ativo" },
      select: { id: true, dataNascimento: true },
    })
    expect(mockDb.frequencia.upsert).toHaveBeenCalledOnce()
    expect(res.status).toBe(303)
    expect(res.headers.get("location")).toContain("ok=1")
    expect(res.headers.get("location")).not.toContain("nome=")
  })

  it("retorna erro genérico quando nascimento não confere", async () => {
    const res = await POST(makeRequest({ token: "assinado", matricula: "1", dataNascimento: "2015-06-16" }) as unknown as NextRequest)

    expect(mockDb.frequencia.upsert).not.toHaveBeenCalled()
    expect(res.headers.get("location")).toContain("erro=credenciais")
  })

  it("retorna erro genérico quando aluno não pertence à turma", async () => {
    mockDb.aluno.findFirst.mockResolvedValue(null)
    const res = await POST(makeRequest({ token: "assinado", matricula: "99", dataNascimento: "2015-06-15" }) as unknown as NextRequest)

    expect(res.headers.get("location")).toContain("erro=credenciais")
  })

  it("faz upsert e sinaliza presença já existente", async () => {
    mockDb.frequencia.findUnique.mockResolvedValue({ id: 99 })
    const res = await POST(makeRequest({ token: "assinado", matricula: "1", dataNascimento: "2015-06-15" }) as unknown as NextRequest)

    expect(mockDb.frequencia.upsert).toHaveBeenCalledWith({
      where: { alunoId_data: { alunoId: 1, data: new Date("2026-06-24T12:00:00.000Z") } },
      create: { alunoId: 1, data: new Date("2026-06-24T12:00:00.000Z"), presenca: "Presente" },
      update: { presenca: "Presente" },
    })
    expect(res.headers.get("location")).toContain("ja=1")
  })

  it("retorna 429 quando rate limit global excede", async () => {
    mockRateLimit.mockReturnValueOnce({ ok: false, retryAfterMs: 60_000 })
    const res = await POST(makeRequest({ token: "assinado", matricula: "1", dataNascimento: "2015-06-15" }) as unknown as NextRequest)

    expect(res.status).toBe(429)
    expect(mockVerifyToken).not.toHaveBeenCalled()
  })
})
