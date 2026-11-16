export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getResponsavelSession, responsavelCookieName, revogarSessoesResponsavel } from "@/lib/responsavel-session"

export async function POST() {
  // Revoga no servidor: o cookie copiado deixa de valer, não só o do navegador.
  try {
    const sessao = await getResponsavelSession()
    if (sessao.authenticated && sessao.responsavelId) await revogarSessoesResponsavel(sessao.responsavelId)
  } catch {
    // Mesmo se a revogação falhar, o cookie local é apagado.
  }
  const response = NextResponse.json({ ok: true })
  response.cookies.set(responsavelCookieName(), "", { maxAge: 0, path: "/" })
  return response
}
