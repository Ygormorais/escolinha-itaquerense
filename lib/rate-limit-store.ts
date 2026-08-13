export type RateLimitEntry = { count: number; resetAt: number }

export type RateLimitStore = {
  get(key: string): RateLimitEntry | undefined
  set(key: string, entry: RateLimitEntry): void
  /** Incrementa a janela em uma operação indivisível no store. */
  consume(key: string, now: number, windowMs: number): RateLimitEntry
  delete(key: string): void
  prune(now: number): void
  clear(): void
}

export function createMemoryRateLimitStore(): RateLimitStore {
  const attempts = new Map<string, RateLimitEntry>()

  return {
    get: (key) => attempts.get(key),
    set: (key, entry) => attempts.set(key, entry),
    consume: (key, now, windowMs) => {
      const entry = attempts.get(key)
      if (!entry || now >= entry.resetAt) {
        const next = { count: 1, resetAt: now + windowMs }
        attempts.set(key, next)
        return next
      }
      const next = { ...entry, count: entry.count + 1 }
      attempts.set(key, next)
      return next
    },
    delete: (key) => attempts.delete(key),
    prune: (now) => {
      for (const [key, entry] of attempts) {
        if (now > entry.resetAt) attempts.delete(key)
      }
    },
    clear: () => attempts.clear(),
  }
}
