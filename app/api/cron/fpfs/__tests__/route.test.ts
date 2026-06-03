import { describe, it, expect, beforeEach, vi } from "vitest"

const { verifyBearerSecret, syncTodos, syncCampeonato } = vi.hoisted(() => ({
  verifyBearerSecret: vi.fn(),
  syncTodos: vi.fn(),
  syncCampeonato: vi.fn(),
}))

vi.mock("@/lib/env", () => ({
  getCronSecret: () => "segredo",
  verifyBearerSecret: (...args: unknown[]) => verifyBearerSecret(...args),
}))

vi.mock("@/lib/fpfs/sync", () => ({ syncTodos, syncCampeonato }))

import { GET } from "@/app/api/cron/fpfs/route"

beforeEach(() => {
  vi.clearAllMocks()
  syncTodos.mockResolvedValue([])
  syncCampeonato.mockResolvedValue({ campeonatoId: 1, jogosNovos: 1, jogosAtualizados: 0, linhasClassificacao: 2 })
})

function req(url = "http://localhost/api/cron/fpfs") {
  return new Request(url)
}

describe("GET /api/cron/fpfs", () => {
  it("401 quando auth invalida", async () => {
    verifyBearerSecret.mockReturnValue(false)
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(syncTodos).not.toHaveBeenCalled()
  })

  it("roda syncTodos quando nao ha campeonatoId", async () => {
    verifyBearerSecret.mockReturnValue(true)
    const res = await GET(req())
    expect(res.status).toBe(200)
    expect(syncTodos).toHaveBeenCalled()
  })

  it("roda syncCampeonato quando ha ?campeonatoId=", async () => {
    verifyBearerSecret.mockReturnValue(true)
    const res = await GET(req("http://localhost/api/cron/fpfs?campeonatoId=5"))
    expect(res.status).toBe(200)
    expect(syncCampeonato).toHaveBeenCalledWith(5)
  })

  it("500 quando o sync lanca erro", async () => {
    verifyBearerSecret.mockReturnValue(true)
    syncTodos.mockRejectedValue(new Error("falhou"))
    const res = await GET(req())
    expect(res.status).toBe(500)
  })
})
