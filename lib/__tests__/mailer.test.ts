import { afterEach, describe, expect, it } from "vitest"
import { getErroConfiguracaoEmail } from "@/lib/mailer"

const original = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
}

afterEach(() => {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe("getErroConfiguracaoEmail", () => {
  it("lista as variáveis ausentes", () => {
    delete process.env.SMTP_HOST
    delete process.env.SMTP_USER
    delete process.env.SMTP_PASS
    expect(getErroConfiguracaoEmail()).toContain("SMTP_HOST, SMTP_USER, SMTP_PASS")
  })

  it("aceita uma configuração SMTP completa", () => {
    process.env.SMTP_HOST = "smtp.example.test"
    process.env.SMTP_USER = "user@example.test"
    process.env.SMTP_PASS = "secret"
    expect(getErroConfiguracaoEmail()).toBeNull()
  })
})
