export type RateLimitEntry = { count: number; resetAt: number }

export type RateLimitStore = {
  get(key: string): RateLimitEntry | undefined
  set(key: string, entry: RateLimitEntry): void
  delete(key: string): void
  prune(now: number): void
  clear(): void
}

export function createMemoryRateLimitStore(): RateLimitStore {
  const attempts = new Map<string, RateLimitEntry>()

  return {
    get: (key) => attempts.get(key),
    set: (key, entry) => attempts.set(key, entry),
    delete: (key) => attempts.delete(key),
    prune: (now) => {
      for (const [key, entry] of attempts) {
        if (now > entry.resetAt) attempts.delete(key)
      }
    },
    clear: () => attempts.clear(),
  }
}
