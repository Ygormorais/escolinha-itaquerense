import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  findUsuario: vi.fn(),
  findResponsavel: vi.fn(),
  isEnvAdminUsername: vi.fn(() => false),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.getCookie })),
}))

vi.mock("@/lib/env", () => ({
  getSessionSecret: () => "session-revocation-test-secret-with-enough-entropy",
  checkCredentialsFromEnv: vi.fn(),
  isEnvAdminUsername: mocks.isEnvAdminUsername,
}))

vi.mock("@/lib/db", () => ({
  db: {
    usuario: { findUnique: mocks.findUsuario },
    responsavel: { findUnique: mocks.findResponsavel },
  },
}))

import { createSession, getSession } from "@/lib/session"
import { createResponsavelSession, getResponsavelSession } from "@/lib/responsavel-session"

describe("revogação de sessão", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isEnvAdminUsername.mockReturnValue(false)
  })

  it("aceita usuário ativo e usa o perfil atual do banco", async () => {
    mocks.findUsuario.mockResolvedValue({ ativo: true, role: "tecnico", sessaoVersao: 0 })
    mocks.getCookie.mockReturnValue({ value: await createSession("joao", "admin") })

    await expect(getSession()).resolves.toEqual({ authenticated: true, user: "joao", role: "tecnico" })
    expect(mocks.findUsuario).toHaveBeenCalledWith({
      where: { username: "joao" },
      select: { ativo: true, role: true, sessaoVersao: true },
    })
  })

  it("revoga imediatamente sessão de usuário desativado", async () => {
    mocks.findUsuario.mockResolvedValue({ ativo: false, role: "secretaria" })
    mocks.getCookie.mockReturnValue({ value: await createSession("joao", "secretaria") })

    await expect(getSession()).resolves.toEqual({ authenticated: false })
  })

  it("revoga imediatamente sessão de responsável desativado", async () => {
    mocks.findResponsavel.mockResolvedValue({ ativo: false, sessaoVersao: 0 })
    mocks.getCookie.mockReturnValue({ value: await createResponsavelSession(7) })

    await expect(getResponsavelSession()).resolves.toEqual({ authenticated: false })
    expect(mocks.findResponsavel).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { ativo: true, sessaoVersao: true },
    })
  })

  it("revoga cookie da equipe quando a versão de sessão mudou (troca de senha/logout)", async () => {
    mocks.findUsuario.mockResolvedValue({ ativo: true, role: "admin", sessaoVersao: 3 })
    mocks.getCookie.mockReturnValue({ value: await createSession("joao", "admin", "db", 2) })
    await expect(getSession()).resolves.toEqual({ authenticated: false })

    mocks.getCookie.mockReturnValue({ value: await createSession("joao", "admin", "db", 3) })
    await expect(getSession()).resolves.toMatchObject({ authenticated: true })
  })

  it("revoga cookie do responsável quando a versão de sessão mudou", async () => {
    mocks.findResponsavel.mockResolvedValue({ ativo: true, sessaoVersao: 1 })
    mocks.getCookie.mockReturnValue({ value: await createResponsavelSession(7, 0) })
    await expect(getResponsavelSession()).resolves.toEqual({ authenticated: false })
  })

  it("expira no servidor cookie da equipe (7 dias) e do responsável (1 dia)", async () => {
    vi.useFakeTimers()
    try {
      mocks.findUsuario.mockResolvedValue({ ativo: true, role: "admin", sessaoVersao: 0 })
      mocks.findResponsavel.mockResolvedValue({ ativo: true, sessaoVersao: 0 })
      const staff = await createSession("joao", "admin")
      const resp = await createResponsavelSession(7)

      vi.advanceTimersByTime(6 * 86400_000)
      mocks.getCookie.mockReturnValue({ value: staff })
      await expect(getSession()).resolves.toMatchObject({ authenticated: true })
      mocks.getCookie.mockReturnValue({ value: resp })
      await expect(getResponsavelSession()).resolves.toEqual({ authenticated: false })

      vi.advanceTimersByTime(2 * 86400_000)
      mocks.getCookie.mockReturnValue({ value: staff })
      await expect(getSession()).resolves.toEqual({ authenticated: false })
    } finally {
      vi.useRealTimers()
    }
  })

  it("recusa cookie do formato antigo, sem iat/versão", async () => {
    mocks.findUsuario.mockResolvedValue({ ativo: true, role: "admin", sessaoVersao: 0 })
    const { createHmac } = await import("crypto")
    const assinar = (v: string) => `${v}.${createHmac("sha256", "session-revocation-test-secret-with-enough-entropy").update(v).digest("hex")}`
    mocks.getCookie.mockReturnValue({ value: assinar("auth2:joao:admin:db") })
    await expect(getSession()).resolves.toEqual({ authenticated: false })
  })

  it("aceita o administrador do .env, que não tem conta no banco", async () => {
    // O login aceita ADMIN_USERNAME/ADMIN_PASSWORD; a sessão precisa reconhecer o mesmo usuário.
    mocks.findUsuario.mockResolvedValue(null)
    mocks.isEnvAdminUsername.mockReturnValue(true)
    mocks.getCookie.mockReturnValue({ value: await createSession("admin", "admin", "env") })

    await expect(getSession()).resolves.toEqual({ authenticated: true, user: "admin", role: "admin" })
  })

  it("recusa nome sem conta no banco que não é o administrador do .env", async () => {
    mocks.findUsuario.mockResolvedValue(null)
    mocks.getCookie.mockReturnValue({ value: await createSession("fantasma", "admin") })

    await expect(getSession()).resolves.toEqual({ authenticated: false })
  })

  it("conta desativada no banco prevalece sobre o administrador do .env", async () => {
    mocks.findUsuario.mockResolvedValue({ ativo: false, role: "admin" })
    mocks.isEnvAdminUsername.mockReturnValue(true)
    mocks.getCookie.mockReturnValue({ value: await createSession("admin", "admin") })

    await expect(getSession()).resolves.toEqual({ authenticated: false })
  })

  it("conta do banco excluída com o nome do admin do .env não vira admin", async () => {
    // Cookie emitido pelo login do banco (perfil secretaria); a conta foi excluída depois.
    mocks.findUsuario.mockResolvedValue(null)
    mocks.isEnvAdminUsername.mockReturnValue(true)
    mocks.getCookie.mockReturnValue({ value: await createSession("admin", "secretaria") })

    await expect(getSession()).resolves.toEqual({ authenticated: false })
  })
})
