import { describe, it, expect, beforeEach, vi } from "vitest"

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }))

vi.mock("@/lib/db", () => ({
  db: { $queryRaw: (...args: unknown[]) => queryRaw(...args) },
}))

import { GET } from "@/app/api/health/route"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/health", () => {
  it("200 com status ok quando o banco responde", async () => {
    queryRaw.mockResolvedValue([{ 1: 1 }])
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ status: "ok", db: "ok" })
  })

  it("503 com status degraded quando o banco falha", async () => {
    queryRaw.mockRejectedValue(new Error("SQLITE_CANTOPEN: unable to open database file"))
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body).toMatchObject({ status: "degraded", db: "error" })
  })

  it("não vaza detalhes do erro no corpo", async () => {
    queryRaw.mockRejectedValue(new Error("caminho secreto C:\\segredos\\prod.db"))
    const res = await GET()
    const texto = JSON.stringify(await res.json())
    expect(texto).not.toContain("segredo")
  })
})
