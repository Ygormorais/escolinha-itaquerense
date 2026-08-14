import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  findUsuario: vi.fn(),
  findResponsavel: vi.fn(),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.getCookie })),
}))

vi.mock("@/lib/env", () => ({
  getSessionSecret: () => "session-revocation-test-secret-with-enough-entropy",
  checkCredentialsFromEnv: vi.fn(),
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
})
