import { createMemoryRateLimitStore, type RateLimitStore } from "@/lib/rate-limit-store"
import { createSqliteRateLimitStore } from "@/lib/rate-limit-store-sqlite"

function createDefaultStore(): RateLimitStore {
  if (process.env.NODE_ENV === "test") return createMemoryRateLimitStore()
  try {
    return createSqliteRateLimitStore()
  } catch {
    return createMemoryRateLimitStore()
  }
}

let activeStore: RateLimitStore = createDefaultStore()

/** Troca o store (apenas testes). */
export function setRateLimitStore(store: RateLimitStore): void {
  activeStore = store
}

export function resetRateLimitStore(): void {
  activeStore.clear()
}

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000
): { ok: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now()
  activeStore.prune(now)

  const entry = activeStore.get(key)

  if (!entry || now > entry.resetAt) {
    activeStore.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: maxAttempts - 1 }
  }

  entry.count++
  activeStore.set(key, entry)

  if (entry.count > maxAttempts) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, entry.resetAt - now),
    }
  }

  return { ok: true, remaining: maxAttempts - entry.count }
}
