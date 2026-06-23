import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
}))

import { requireAuth, can, roleLabel, redirectIfNotAuthenticated } from "@/lib/auth"
import { getSession } from "@/lib/session"

const mockGetSession = getSession as ReturnType<typeof vi.fn>

beforeEach(() => vi.clearAllMocks())

describe("requireAuth", () => {
  it("retorna user e role quando autenticado", async () => {
    mockGetSession.mockResolvedValue({ authenticated: true, user: "admin", role: "admin" })
    const result = await requireAuth()
    expect(result).toEqual({ user: "admin", role: "admin" })
  })

  it("lança erro quando não autenticado", async () => {
    mockGetSession.mockResolvedValue({ authenticated: false })
    await expect(requireAuth()).rejects.toThrow("Não autenticado")
  })

  it("lança erro quando role não está na lista permitida", async () => {
    mockGetSession.mockResolvedValue({ authenticated: true, user: "sec", role: "secretaria" })
    await expect(requireAuth(["admin"])).rejects.toThrow("Acesso não autorizado")
  })

  it("permite acesso quando role está na lista", async () => {
    mockGetSession.mockResolvedValue({ authenticated: true, user: "sec", role: "secretaria" })
    const result = await requireAuth(["admin", "secretaria"])
    expect(result.role).toBe("secretaria")
  })

  it("permite qualquer role quando lista está vazia (sem restrição)", async () => {
    mockGetSession.mockResolvedValue({ authenticated: true, user: "tec", role: "tecnico" })
    const result = await requireAuth()
    expect(result.role).toBe("tecnico")
  })
})

describe("can", () => {
  it("admin pode tudo", () => {
    expect(can("admin", "secretaria", "tecnico")).toBe(true)
  })

  it("secretaria pode quando está na lista", () => {
    expect(can("secretaria", "secretaria")).toBe(true)
    expect(can("secretaria", "tecnico")).toBe(false)
  })

  it("retorna false para role undefined", () => {
    expect(can(undefined, "admin")).toBe(false)
  })

  it("retorna false para role vazio", () => {
    expect(can("", "admin")).toBe(false)
  })
})

describe("roleLabel", () => {
  it("retorna label correto para roles conhecidos", () => {
    expect(roleLabel("admin")).toBe("Administrador")
    expect(roleLabel("secretaria")).toBe("Secretaria")
    expect(roleLabel("tecnico")).toBe("Técnico")
  })

  it("retorna o próprio valor para role desconhecido", () => {
    expect(roleLabel("superuser")).toBe("superuser")
  })
})

describe("redirectIfNotAuthenticated", () => {
  it("redireciona para /login quando não autenticado", async () => {
    mockGetSession.mockResolvedValue({ authenticated: false })
    const guard = redirectIfNotAuthenticated()
    await expect(guard()).rejects.toThrow("REDIRECT:/login")
  })

  it("redireciona para /dashboard quando role não é permitido", async () => {
    mockGetSession.mockResolvedValue({ authenticated: true, user: "tec", role: "tecnico" })
    const guard = redirectIfNotAuthenticated(["admin"])
    await expect(guard()).rejects.toThrow("REDIRECT:/dashboard")
  })

  it("não redireciona quando autenticado e role permitido", async () => {
    mockGetSession.mockResolvedValue({ authenticated: true, user: "admin", role: "admin" })
    const guard = redirectIfNotAuthenticated(["admin"])
    await expect(guard()).resolves.toBeUndefined()
  })
})
