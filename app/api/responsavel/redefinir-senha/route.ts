export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/rate-limit-response"

export async function POST(request: Request) {
  const { token, senha } = await request.json()
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const limit = checkRateLimit(`redefinir-senha:${ip}`)
  if (!limit.ok) return rateLimitResponse(limit.retryAfterMs)

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token inválido" }, { status: 400 })
  }
  if (!senha || senha.length < 6) {
    return NextResponse.json({ error: "A senha deve ter no mínimo 6 caracteres" }, { status: 400 })
  }

  const resetToken = await db.resetToken.findUnique({ where: { token } })
  if (!resetToken || resetToken.usado || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 })
  }

  const senhaHash = bcrypt.hashSync(senha, 10)

  await db.$transaction([
    db.responsavel.update({
      where: { id: resetToken.responsavelId },
      data: { senha: senhaHash },
    }),
    db.resetToken.update({
      where: { id: resetToken.id },
      data: { usado: true },
    }),
  ])

  return NextResponse.json({ message: "Senha redefinida com sucesso! Faça login." })
}
