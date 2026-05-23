import nodemailer from "nodemailer"

export function createTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error(
      "Configure SMTP_HOST, SMTP_USER e SMTP_PASS no arquivo .env para enviar e-mails"
    )
  }

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
