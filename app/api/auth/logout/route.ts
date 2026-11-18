export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { cookieName } from "@/lib/session"

export async function POST() {
  // Sair apaga o cookie deste navegador. Não revoga as outras sessões da conta (outro
  // aparelho, outra aba): isso é feito na troca/redefinição de senha, que incrementa sessaoVersao.
  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName(), "", { maxAge: 0, path: "/" })
  return response
}
