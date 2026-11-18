import { NextResponse } from "next/server"

export function rateLimitResponse(retryAfterMs?: number) {
  const headers: HeadersInit = {}
  if (retryAfterMs != null && retryAfterMs > 0) {
    headers["Retry-After"] = String(Math.ceil(retryAfterMs / 1000))
  }
  const minutos = Math.max(1, Math.ceil((retryAfterMs ?? 60_000) / 60_000))
  return NextResponse.json(
    { error: `Muitas tentativas. Aguarde ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.` },
    { status: 429, headers }
  )
}
