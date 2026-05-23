import { NextResponse } from "next/server"
import { checkCredentials, createSession, cookieName, cookieMaxAge } from "@/lib/session"
import { checkDbCredentials } from "@/app/actions/usuarios"

export async function POST(request: Request) {
  const { username, password } = await request.json()

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
