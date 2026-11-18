export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { responsavelCookieName } from "@/lib/responsavel-session"

export async function POST() {
  // Sair apaga o cookie deste navegador; as outras sessões só caem na redefinição de senha.
  const response = NextResponse.json({ ok: true })
  response.cookies.set(responsavelCookieName(), "", { maxAge: 0, path: "/" })
  return response
}
