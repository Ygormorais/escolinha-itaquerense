import { NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { enviarEmail } from "@/lib/mailer"
import { getConfig } from "@/lib/config"
import { checkRateLimit } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/rate-limit-response"

export async function POST(request: Request) {
  const { email } = await request.json()
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const limit = checkRateLimit(`recuperar-senha:${ip}`)
  if (!limit.ok) return rateLimitResponse(limit.retryAfterMs)

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }

  const responsavel = await db.responsavel.findUnique({ where: { email: email.toLowerCase() } })
  if (!responsavel) {
    return NextResponse.json({
      message: "Se o email existir, enviaremos um link de recuperação.",
    })
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await db.resetToken.create({
    data: {
      token,
      responsavelId: responsavel.id,
      expiresAt,
    },
  })

  const config = getConfig()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const resetLink = `${baseUrl}/responsavel/redefinir-senha?token=${token}`

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h1 style="color:#C62828">Recuperação de senha</h1>
      <p>Olá, <strong>${responsavel.nome}</strong>!</p>
      <p>Recebemos um pedido de redefinição de senha para o portal do responsável.</p>
      <p style="text-align:center;margin:32px 0">
        <a href="${resetLink}"
           style="display:inline-block;background:#C62828;color:#fff;padding:12px 24px;
                  border-radius:6px;text-decoration:none;font-weight:bold">
          Redefinir minha senha
        </a>
      </p>
      <p style="color:#666;font-size:14px">
        Este link expira em <strong>1 hora</strong>. Se não foi você quem pediu,
        ignore este email.
      </p>
      <hr style="border:none;border-top:1px solid #eee" />
      <p style="color:#999;font-size:12px">${config.nome}</p>
    </div>
  `

  try {
    await enviarEmail(responsavel.email, `[${config.nome}] Recuperação de senha`, html)
  } catch {
    return NextResponse.json({ error: "Erro ao enviar email. Verifique as configurações de SMTP." }, { status: 500 })
  }

  return NextResponse.json({
    message: "Se o email existir, enviaremos um link de recuperação.",
  })
}
