import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { checkRateLimit, resetRateLimitStore } from "../rate-limit"
import { createMemoryRateLimitStore } from "../rate-limit-store"

describe("lib/rate-limit", () => {
  beforeEach(() => {
    resetRateLimitStore()
  })

  afterEach(() => {
    vi.useRealTimers()
    resetRateLimitStore()
  })

  it("allows first request", () => {
    const result = checkRateLimit("test:1")
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("blocks after too many requests", () => {
    const key = "test:block"
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5).ok).toBe(true)
    }
    const blocked = checkRateLimit(key, 5)
    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
  })

  it("allows different keys independently", () => {
    const a = "test:indep:a"
    const b = "test:indep:b"
    for (let i = 0; i < 6; i++) checkRateLimit(a, 5)
    expect(checkRateLimit(a, 5).ok).toBe(false)
    expect(checkRateLimit(b, 5).ok).toBe(true)
  })

  it("resets window after expiry", () => {
    vi.useFakeTimers()
    const key = "test:window"
    const windowMs = 60_000

    for (let i = 0; i < 6; i++) checkRateLimit(key, 5, windowMs)
    expect(checkRateLimit(key, 5, windowMs).ok).toBe(false)

    vi.advanceTimersByTime(windowMs + 1)
    expect(checkRateLimit(key, 5, windowMs).ok).toBe(true)
  })

  it("prunes expired entries on check", () => {
    const store = createMemoryRateLimitStore()
    const now = Date.now()
    store.set("old", { count: 10, resetAt: now - 1 })
    store.prune(now)
    expect(store.get("old")).toBeUndefined()
  })
})
