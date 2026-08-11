import { beforeEach, describe, expect, it } from "vitest"
import { CHECKIN_TOKEN_TTL_MS, createCheckinToken, verifyCheckinToken } from "@/lib/checkin-token"

const NOW = new Date("2026-08-11T12:00:00.000Z").getTime()

beforeEach(() => {
  process.env.SESSION_SECRET = "test-checkin-secret-with-enough-entropy"
})

describe("check-in token", () => {
  it("assina turma, data e validade curta", () => {
    const token = createCheckinToken("Sub-13", "2026-08-11", NOW)
    const claims = verifyCheckinToken(token, NOW + 1)

    expect(claims).toMatchObject({ turma: "Sub-13", data: "2026-08-11", iat: NOW })
    expect(claims?.exp).toBe(NOW + CHECKIN_TOKEN_TTL_MS)
    expect(claims?.nonce).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it("rejeita adulteração da turma", () => {
    const token = createCheckinToken("Sub-13", "2026-08-11", NOW)
    const [payload, signature] = token.split(".")
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    claims.turma = "Sub-15"
    const altered = `${Buffer.from(JSON.stringify(claims)).toString("base64url")}.${signature}`

    expect(verifyCheckinToken(altered, NOW)).toBeNull()
  })

  it("rejeita token expirado e formato legado previsível", () => {
    const token = createCheckinToken("Sub-13", "2026-08-11", NOW)
    expect(verifyCheckinToken(token, NOW + CHECKIN_TOKEN_TTL_MS)).toBeNull()
    expect(verifyCheckinToken("Sub-13:2026-08-11", NOW)).toBeNull()
  })

  it("rejeita datas inexistentes", () => {
    expect(() => createCheckinToken("Sub-13", "2026-02-30", NOW)).toThrow()
  })
})
