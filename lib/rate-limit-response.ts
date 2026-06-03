import { NextResponse } from "next/server"

export function rateLimitResponse(retryAfterMs?: number) {
  const headers: HeadersInit = {}
  if (retryAfterMs != null && retryAfterMs > 0) {
    headers["Retry-After"] = String(Math.ceil(retryAfterMs / 1000))
  }
  return NextResponse.json(
    { error: "Muitas tentativas. Aguarde 1 minuto." },
    { status: 429, headers }
  )
}
