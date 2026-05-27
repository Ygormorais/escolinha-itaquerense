import { describe, it, expect, beforeEach } from "vitest"
import { checkRateLimit } from "../rate-limit"

describe("lib/rate-limit", () => {
  beforeEach(() => {
    // Reset rates by advancing time
  })

  it("allows first request", () => {
    const result = checkRateLimit("test:1")
    expect(result.ok).toBe(true)
  })

  it("blocks after too many requests", () => {
    const key = `test:block:${Date.now()}`
    for (let i = 0; i < 6; i++) {
      checkRateLimit(key)
    }
    const result = checkRateLimit(key)
    expect(result.ok).toBe(false)
  })

  it("allows different keys independently", () => {
    const a = `test:indep:a:${Date.now()}`
    const b = `test:indep:b:${Date.now()}`
    for (let i = 0; i < 6; i++) checkRateLimit(a)
    expect(checkRateLimit(a).ok).toBe(false)
    expect(checkRateLimit(b).ok).toBe(true)
  })
})
