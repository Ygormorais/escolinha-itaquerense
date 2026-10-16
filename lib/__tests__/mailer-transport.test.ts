import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}))

vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }))

import { createTransport, enviarEmail } from "@/lib/mailer"

const VARS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"] as const
const original = Object.fromEntries(VARS.map((k) => [k, process.env[k]]))

function configurar(extra: Partial<Record<(typeof VARS)[number], string>> = {}) {
  process.env.SMTP_HOST = "smtp.example.test"
  process.env.SMTP_USER = "escolinha@example.test"
  process.env.SMTP_PASS = "segredo"
  delete process.env.SMTP_PORT
  Object.assign(process.env, extra)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail })
  mocks.sendMail.mockResolvedValue({ messageId: "1" })
})

afterEach(() => {
  for (const k of VARS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
})

describe("createTransport", () => {
  it("recusa criar o transporte quando falta configuração", () => {
    configurar()
    delete process.env.SMTP_PASS

    expect(() => createTransport()).toThrow("SMTP_PASS")
    expect(mocks.createTransport).not.toHaveBeenCalled()
  })

  it("trata variável só com espaços como ausente", () => {
    configurar({ SMTP_HOST: "   " })

    expect(() => createTransport()).toThrow("SMTP_HOST")
  })

  it("usa a porta 587 sem TLS implícito por padrão", () => {
    configurar()

    createTransport()

    expect(mocks.createTransport).toHaveBeenCalledWith({
      host: "smtp.example.test",
      port: 587,
      secure: false,
      auth: { user: "escolinha@example.test", pass: "segredo" },
    })
  })

  it("liga o TLS implícito na porta 465", () => {
    configurar({ SMTP_PORT: "465" })

    createTransport()

    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({ port: 465, secure: true }))
  })
})

describe("enviarEmail", () => {
  it("envia com o usuário SMTP como remetente", async () => {
    configurar()

    await enviarEmail("pai@example.test", "Assunto", "<p>Oi</p>")

    expect(mocks.sendMail).toHaveBeenCalledWith({
      from: "escolinha@example.test",
      to: "pai@example.test",
      subject: "Assunto",
      html: "<p>Oi</p>",
    })
  })

  it("propaga a falha do servidor SMTP", async () => {
    configurar()
    mocks.sendMail.mockRejectedValue(new Error("535 auth failed"))

    await expect(enviarEmail("pai@example.test", "Assunto", "<p>Oi</p>")).rejects.toThrow("535 auth failed")
  })
})
