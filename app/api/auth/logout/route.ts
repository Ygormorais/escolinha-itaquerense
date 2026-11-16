export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { cookieName, getSession, revogarSessoesUsuario } from "@/lib/session"

export async function POST() {
  // Revoga no servidor: o cookie copiado deixa de valer, não só o do navegador.
  try {
    const sessao = await getSession()
    if (sessao.authenticated && sessao.user) await revogarSessoesUsuario(sessao.user)
  } catch {
    // Mesmo se a revogação falhar, o cookie local é apagado.
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName(), "", { maxAge: 0, path: "/" })
  return response
}
