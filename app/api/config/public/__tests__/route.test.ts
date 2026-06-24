import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn().mockReturnValue({ whatsapp: true }),
}))

import { GET } from "../route"

describe("GET /api/config/public", () => {
  it("retorna a flag whatsapp da config", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ whatsapp: true })
  })

  it("reflete a config atual sem expor outros campos", async () => {
    const { getConfig } = await import("@/lib/config")
    ;(getConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      whatsapp: false,
      chavePix: "segredo",
      diaVencimento: 10,
    })
    const res = await GET()
    const body = await res.json()
    expect(body).toEqual({ whatsapp: false })
    expect(body.chavePix).toBeUndefined()
  })
})
