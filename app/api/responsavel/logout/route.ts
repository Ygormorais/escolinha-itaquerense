import { NextResponse } from "next/server"
import { responsavelCookieName } from "@/lib/responsavel-session"

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(responsavelCookieName(), "", { maxAge: 0, path: "/" })
  return response
}
