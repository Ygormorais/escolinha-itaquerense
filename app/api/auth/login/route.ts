import { NextResponse } from "next/server"
import { checkCredentials, createSession, cookieName, cookieMaxAge } from "@/lib/session"
import { checkDbCredentials } from "@/app/actions/usuarios"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  const { username, password } = await request.json()
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const limit = checkRateLimit(`login:${ip}`)
  if (!limit.ok) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 })
  }

  // Check DB users first, then fall back to env vars
  const dbResult = await checkDbCredentials(username ?? "", password ?? "")
  const valid = dbResult.ok || checkCredentials(username ?? "", password ?? "")

  if (!valid) {
    return NextResponse.json({ error: "Usuário ou senha incorretos" }, { status: 401 })
  }

  const token = await createSession(username)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: cookieMaxAge(),
    path: "/",
  })
  return response
}
