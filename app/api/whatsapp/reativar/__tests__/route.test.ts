import { describe, it, expect, vi, beforeEach } from "vitest"
import type { NextRequest } from "next/server"

vi.mock("@/lib/whatsapp/session", () => ({
  unblockSession: vi.fn(),
}))

vi.mock("@/lib/env", () => ({
  getEvolutionApiKey: vi.fn().mockReturnValue("api-key-secret"),
  verifyEvolutionAuth: vi.fn(),
}))

import { POST } from "../route"
import { unblockSession } from "@/lib/whatsapp/session"
import { verifyEvolutionAuth } from "@/lib/env"

const mockUnblock = unblockSession as ReturnType<typeof vi.fn>
const mockVerify = verifyEvolutionAuth as ReturnType<typeof vi.fn>

function makeRequest(body: object, authorized = true): NextRequest {
  mockVerify.mockReturnValue(authorized)
  return new Request("http://localhost/api/whatsapp/reativar", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer api-key-secret" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
  mockVerify.mockReturnValue(true)
  mockUnblock.mockResolvedValue(undefined)
})

describe("POST /api/whatsapp/reativar", () => {
  it("retorna 401 sem auth válido", async () => {
    const res = await POST(makeRequest({ telefone: "11999" }, false))
    expect(res.status).toBe(401)
    expect(mockUnblock).not.toHaveBeenCalled()
  })

  it("retorna 400 sem telefone", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("desbloqueia sessão e retorna ok", async () => {
    const res = await POST(makeRequest({ telefone: "11999887766" }))
    expect(mockUnblock).toHaveBeenCalledWith("11999887766")
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it("retorna 404 quando sessão não existe (P2025)", async () => {
    mockUnblock.mockRejectedValue({ code: "P2025" })
    const res = await POST(makeRequest({ telefone: "11999887766" }))
    expect(res.status).toBe(404)
  })

  it("retorna 500 para erro inesperado", async () => {
    mockUnblock.mockRejectedValue(new Error("DB timeout"))
    const res = await POST(makeRequest({ telefone: "11999887766" }))
    expect(res.status).toBe(500)
  })
})
