import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { createResponsavelSession, responsavelCookieName, responsavelCookieMaxAge } from "@/lib/responsavel-session"
import { checkRateLimit } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/rate-limit-response"

export async function POST(request: Request) {
  const { email, senha } = await request.json()
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const limit = checkRateLimit(`resp-login:${ip}`)
  if (!limit.ok) return rateLimitResponse(limit.retryAfterMs)

  const responsavel = await db.responsavel.findUnique({ where: { email } })
  if (!responsavel || !responsavel.ativo) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 })
  }

  const match = await bcrypt.compare(senha, responsavel.senha)
  if (!match) {
    return NextResponse.json({ error: "Email ou senha incorretos" }, { status: 401 })
  }

  const token = await createResponsavelSession(responsavel.id)
  const response = NextResponse.json({ ok: true, nome: responsavel.nome })
  response.cookies.set(responsavelCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: responsavelCookieMaxAge(),
    path: "/",
  })
  return response
}
