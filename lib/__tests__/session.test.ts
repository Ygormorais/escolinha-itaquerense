import { describe, it, expect } from "vitest"
import { createHmac, timingSafeEqual } from "crypto"

function sign(value: string, secret: string): string {
  const hmac = createHmac("sha256", secret).update(value).digest("hex")
  return `${value}.${hmac}`
}

function verify(signed: string, secret: string): string | null {
  const lastDot = signed.lastIndexOf(".")
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = sign(value, secret)
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(signed)
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return value
}

describe("session sign/verify", () => {
  const secret = "test-secret-key-123"

  it("signs and verifies a value", () => {
    const signed = sign("auth:admin:admin", secret)
    const result = verify(signed, secret)
    expect(result).toBe("auth:admin:admin")
  })

  it("rejects tampered values", () => {
    const signed = sign("auth:admin:admin", secret)
    const tampered = signed.replace("admin", "hacker")
    const result = verify(tampered, secret)
    expect(result).toBeNull()
  })

  it("rejects values without a dot", () => {
    const result = verify("noseparator", secret)
    expect(result).toBeNull()
  })

  it("rejects empty string", () => {
    const result = verify("", secret)
    expect(result).toBeNull()
  })

  it("handles different secret correctly", () => {
    const signed = sign("auth:user:secretaria", secret)
    const result = verify(signed, "different-secret")
    expect(result).toBeNull()
  })

  it("parses format auth:user:role", () => {
    const signed = sign("auth:joao:tecnico", secret)
    const value = verify(signed, secret)
    expect(value).toBe("auth:joao:tecnico")
    const parts = value!.slice(5).split(":")
    expect(parts[0]).toBe("joao")
    expect(parts[1]).toBe("tecnico")
  })
})
