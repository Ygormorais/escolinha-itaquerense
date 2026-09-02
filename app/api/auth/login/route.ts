export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { checkCredentials, createSession, cookieName, cookieMaxAge } from "@/lib/session"
import { checkDbCredentials } from "@/app/actions/usuarios"
import { checkRateLimit } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/rate-limit-response"
import { INVALID_CREDENTIALS_MESSAGE } from "@/lib/auth-messages"

export async function POST(request: Request) {
  const { username, password } = await request.json()
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  // Em produção limita a 5 tentativas/min por IP (proteção contra brute force).
  // Fora de produção (dev/e2e, todos vindos do mesmo IP local) o limite é
  // relaxado para não bloquear a suíte de testes nem o desenvolvimento.
  const maxLoginAttempts = process.env.NODE_ENV === "production" ? 5 : 1000
  const limit = checkRateLimit(`login:${ip}`, maxLoginAttempts)
  if (!limit.ok) return rateLimitResponse(limit.retryAfterMs)

  // Check DB users first, then fall back to env vars
  const dbResult = await checkDbCredentials(username ?? "", password ?? "")
  const envValid = checkCredentials(username ?? "", password ?? "")
  const valid = dbResult.ok || envValid

  if (!valid) {
    return NextResponse.json({ error: INVALID_CREDENTIALS_MESSAGE }, { status: 401 })
  }

  const role = dbResult.ok ? dbResult.role : "admin"
  const token = await createSession(username, role)
  const response = NextResponse.json({ ok: true, role })
  response.cookies.set(cookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: cookieMaxAge(),
    path: "/",
  })
  return response
}
