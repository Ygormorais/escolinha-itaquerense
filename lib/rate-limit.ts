const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = attempts.get(key)

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: maxAttempts - 1 }
  }

  entry.count++
  if (entry.count > maxAttempts) {
    return { ok: false, remaining: 0 }
  }

  return { ok: true, remaining: maxAttempts - entry.count }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key)
  }
}, 60_000)
