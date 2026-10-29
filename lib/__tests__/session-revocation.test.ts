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
    mocks.findUsuario.mockResolvedValue({ ativo: true, role: "tecnico" })
    mocks.getCookie.mockReturnValue({ value: await createSession("joao", "admin") })

    await expect(getSession()).resolves.toEqual({ authenticated: true, user: "joao", role: "tecnico" })
    expect(mocks.findUsuario).toHaveBeenCalledWith({
      where: { username: "joao" },
      select: { ativo: true, role: true },
    })
  })

  it("revoga imediatamente sessão de usuário desativado", async () => {
    mocks.findUsuario.mockResolvedValue({ ativo: false, role: "secretaria" })
    mocks.getCookie.mockReturnValue({ value: await createSession("joao", "secretaria") })

    await expect(getSession()).resolves.toEqual({ authenticated: false })
  })

  it("revoga imediatamente sessão de responsável desativado", async () => {
    mocks.findResponsavel.mockResolvedValue({ ativo: false })
    mocks.getCookie.mockReturnValue({ value: await createResponsavelSession(7) })

    await expect(getResponsavelSession()).resolves.toEqual({ authenticated: false })
    expect(mocks.findResponsavel).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { ativo: true },
    })
  })

  it("aceita o administrador do .env, que não tem conta no banco", async () => {
    // O login aceita ADMIN_USERNAME/ADMIN_PASSWORD; a sessão precisa reconhecer o mesmo usuário.
    mocks.findUsuario.mockResolvedValue(null)
    mocks.isEnvAdminUsername.mockReturnValue(true)
    mocks.getCookie.mockReturnValue({ value: await createSession("admin", "admin") })

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
})
