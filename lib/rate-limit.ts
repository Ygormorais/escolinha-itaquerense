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
const PRUNE_INTERVAL_MS = 5 * 60_000
let nextPruneAt = 0

/** Troca o store (apenas testes). */
export function setRateLimitStore(store: RateLimitStore): void {
  activeStore = store
  nextPruneAt = 0
}

export function resetRateLimitStore(): void {
  activeStore.clear()
  nextPruneAt = 0
}

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 60_000
): { ok: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now()
  if (now >= nextPruneAt) {
    activeStore.prune(now)
    nextPruneAt = now + PRUNE_INTERVAL_MS
  }

  const entry = activeStore.consume(key, now, windowMs)

  if (entry.count > maxAttempts) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, entry.resetAt - now),
    }
  }

  return { ok: true, remaining: maxAttempts - entry.count }
}
