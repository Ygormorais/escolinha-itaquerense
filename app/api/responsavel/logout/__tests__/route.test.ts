import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/responsavel-session", () => ({
  responsavelCookieName: vi.fn().mockReturnValue("resp_session"),
}))

import { POST } from "../route"

describe("POST /api/responsavel/logout", () => {
  it("retorna 200 com ok: true", async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("expira o cookie de sessão do responsável (maxAge=0)", async () => {
    const res = await POST()
    const setCookie = res.headers.get("set-cookie") ?? ""
    expect(setCookie).toContain("resp_session=")
    expect(setCookie).toMatch(/max-age=0/i)
  })
})
