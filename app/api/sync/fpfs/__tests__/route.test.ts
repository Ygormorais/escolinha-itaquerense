import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/env", () => ({ env: { FPFS_SYNC_TOKEN: "segredo" } }))

vi.mock("@/lib/fpfs/sync", () => ({
  syncTodos: vi.fn(),
  syncCampeonato: vi.fn(),
}))

import { POST } from "@/app/api/sync/fpfs/route"
import * as fpfsSync from "@/lib/fpfs/sync"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(fpfsSync.syncTodos).mockResolvedValue([])
  vi.mocked(fpfsSync.syncCampeonato).mockResolvedValue({ campeonatoId: 1, jogosNovos: 1, jogosAtualizados: 0, linhasClassificacao: 2 })
})

function req(token: string | null, body: unknown = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (token != null) headers["x-fpfs-token"] = token
  return new Request("http://localhost/api/sync/fpfs", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
}

describe("POST /api/sync/fpfs", () => {
  it("401 sem token valido", async () => {
    const res = await POST(req("errado"))
    expect(res.status).toBe(401)
  })

  it("roda syncTodos quando body nao traz campeonatoId", async () => {
    const res = await POST(req("segredo"))
    expect(res.status).toBe(200)
    expect(fpfsSync.syncTodos).toHaveBeenCalled()
  })

  it("roda syncCampeonato quando body traz campeonatoId", async () => {
    const res = await POST(req("segredo", { campeonatoId: 1 }))
    expect(res.status).toBe(200)
    expect(fpfsSync.syncCampeonato).toHaveBeenCalledWith(1)
  })
})
