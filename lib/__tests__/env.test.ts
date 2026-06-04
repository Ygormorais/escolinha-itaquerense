import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  verifyBearerSecret,
  verifyEvolutionAuth,
  checkCredentialsFromEnv,
} from "../env"

describe("env helpers", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "test" }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("verifyBearerSecret aceita bearer correto", () => {
    const req = new Request("http://localhost", {
      headers: { authorization: "Bearer secret-123" },
    })
    expect(verifyBearerSecret(req, "secret-123")).toBe(true)
  })

  it("verifyBearerSecret rejeita bearer incorreto", () => {
    const req = new Request("http://localhost", {
      headers: { authorization: "Bearer wrong" },
    })
    expect(verifyBearerSecret(req, "secret-123")).toBe(false)
  })

  it("verifyEvolutionAuth aceita apikey header", () => {
    const req = new Request("http://localhost", {
      headers: { apikey: "evo-key" },
    })
    expect(verifyEvolutionAuth(req, "evo-key")).toBe(true)
  })

  it("checkCredentialsFromEnv usa fallback apenas fora de produção", () => {
    delete process.env.ADMIN_USERNAME
    delete process.env.ADMIN_PASSWORD
    expect(checkCredentialsFromEnv("admin", "escolinha123")).toBe(true)
    expect(checkCredentialsFromEnv("admin", "wrong")).toBe(false)
  })

  it("checkCredentialsFromEnv exige env em produção", () => {
    vi.stubEnv("NODE_ENV", "production")
    delete process.env.ADMIN_USERNAME
    delete process.env.ADMIN_PASSWORD
    expect(checkCredentialsFromEnv("admin", "escolinha123")).toBe(false)
    vi.unstubAllEnvs()
  })
})
