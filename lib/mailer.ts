import nodemailer from "nodemailer"

export function getErroConfiguracaoEmail(): string | null {
  const ausentes = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((nome) => !process.env[nome]?.trim())
  if (ausentes.length === 0) return null
  return `Envio de e-mail não configurado. Preencha ${ausentes.join(", ")} no ambiente do servidor.`
}

export function createTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  const erroConfiguracao = getErroConfiguracaoEmail()
  if (erroConfiguracao) throw new Error(erroConfiguracao)

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function enviarEmail(to: string, subject: string, html: string) {
  const transport = createTransport()
  const from = process.env.SMTP_USER!
  await transport.sendMail({ from, to, subject, html })
}
