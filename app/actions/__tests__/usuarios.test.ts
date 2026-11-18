import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    usuario: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "admin", role: "admin" }),
  ROLES: [
    { value: "admin", label: "Administrador" },
    { value: "secretaria", label: "Secretaria" },
    { value: "tecnico", label: "Técnico" },
  ],
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const cookieSet = vi.fn()
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ set: cookieSet })) }))
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => ({ authenticated: true, user: "admin", role: "admin" })),
  createSession: vi.fn(async () => "novo-cookie"),
  cookieName: () => "escolinha_session",
  cookieMaxAge: () => 100,
}))

vi.mock("bcryptjs", () => ({
  default: { hashSync: vi.fn(() => "bcrypt-hash"), compare: vi.fn() },
  getRounds: vi.fn((hash: string) => Number(hash.slice(4, 6))),
}))

import {
  criarUsuario,
  alterarSenha,
  toggleUsuario,
  deletarUsuario,
  checkDbCredentials,
} from "@/app/actions/usuarios"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import bcrypt from "bcryptjs"

const auth = requireAuth as unknown as ReturnType<typeof vi.fn>

const m = db as unknown as {
  usuario: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}
const compare = bcrypt.compare as unknown as ReturnType<typeof vi.fn>
const hashSync = bcrypt.hashSync as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  m.usuario.findUnique.mockResolvedValue(null)
  m.usuario.create.mockResolvedValue({})
  m.usuario.update.mockResolvedValue({})
  m.usuario.delete.mockResolvedValue({})
  compare.mockResolvedValue(false)
  auth.mockResolvedValue({ user: "admin", role: "admin" })
})

describe("gestão de usuários — restrita a admin", () => {
  const input = { username: "joao", nome: "João", senha: "segredo", role: "secretaria" }

  it("criarUsuario exige papel admin", async () => {
    await criarUsuario(input)
    expect(auth).toHaveBeenCalledWith(["admin"])
  })

  it("criarUsuario rejeita role fora da whitelist, sem criar", async () => {
    const res = await criarUsuario({ ...input, role: "superadmin" })
    expect(res).toEqual({ error: "Função inválida" })
    expect(m.usuario.create).not.toHaveBeenCalled()
  })

  it("alterarSenha exige papel admin", async () => {
    await alterarSenha(3, "novaSenha")
    expect(auth).toHaveBeenCalledWith(["admin"])
  })

  it("alterarSenha incrementa a versão de sessão para revogar cookies antigos", async () => {
    m.usuario.findUnique.mockResolvedValue({ username: "outro" })
    await alterarSenha(3, "novaSenha")
    expect(m.usuario.update.mock.calls[0][0].data).toMatchObject({ sessaoVersao: { increment: 1 } })
    expect(cookieSet).not.toHaveBeenCalled()
  })

  it("alterarSenha reemite o cookie quando o admin troca a própria senha", async () => {
    m.usuario.findUnique.mockResolvedValue({ username: "admin", role: "admin", sessaoVersao: 4 })
    await alterarSenha(1, "novaSenha")
    expect(cookieSet).toHaveBeenCalledWith("escolinha_session", "novo-cookie", expect.objectContaining({ httpOnly: true }))
  })

  it("toggleUsuario exige papel admin", async () => {
    await toggleUsuario(3, false)
    expect(auth).toHaveBeenCalledWith(["admin"])
  })

  it("deletarUsuario exige papel admin", async () => {
    await deletarUsuario(3)
    expect(auth).toHaveBeenCalledWith(["admin"])
  })
})

describe("criarUsuario", () => {
  const input = { username: "joao", nome: "João", senha: "segredo", role: "secretaria" }

  it("rejeita username já existente", async () => {
    m.usuario.findUnique.mockResolvedValue({ id: 1 })
    const res = await criarUsuario(input)
    expect(res).toEqual({ error: "Username já existe" })
    expect(m.usuario.create).not.toHaveBeenCalled()
  })

  it("cria com a senha hasheada", async () => {
    const res = await criarUsuario(input)
    expect(res).toEqual({ success: true })
    expect(m.usuario.create.mock.calls[0][0].data).toMatchObject({
      username: "joao",
      role: "secretaria",
      senha: "bcrypt-hash",
    })
    expect(hashSync).toHaveBeenCalledWith(input.senha, 12)
  })
})

describe("checkDbCredentials", () => {
  it("falha quando o usuário não existe", async () => {
    m.usuario.findUnique.mockResolvedValue(null)
    expect(await checkDbCredentials("x", "y")).toEqual({ ok: false })
  })

  it("falha quando o usuário está inativo", async () => {
    m.usuario.findUnique.mockResolvedValue({ id: 1, ativo: false, senha: "h", nome: "N", role: "admin" })
    expect(await checkDbCredentials("x", "y")).toEqual({ ok: false })
  })

  it("autentica com bcrypt e retorna nome/role", async () => {
    m.usuario.findUnique.mockResolvedValue({ id: 1, ativo: true, senha: "$2b$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", nome: "Admin", role: "admin" })
    compare.mockResolvedValue(true)
    expect(await checkDbCredentials("admin", "senha")).toEqual({ ok: true, nome: "Admin", role: "admin" })
    expect(m.usuario.update).not.toHaveBeenCalled()
  })

  it("falha quando o bcrypt não corresponde", async () => {
    m.usuario.findUnique.mockResolvedValue({ id: 1, ativo: true, senha: "$2b$12$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", nome: "N", role: "admin" })
    compare.mockResolvedValue(false)
    expect(await checkDbCredentials("x", "errada")).toEqual({ ok: false })
    expect(m.usuario.update).not.toHaveBeenCalled()
  })

  it("rejeita hash legado sem executar comparação fraca", async () => {
    m.usuario.findUnique.mockResolvedValue({ id: 1, ativo: true, senha: "a".repeat(64), nome: "N", role: "admin" })

    expect(await checkDbCredentials("legado", "senha")).toEqual({ ok: false })
    expect(compare).not.toHaveBeenCalled()
    expect(m.usuario.update).not.toHaveBeenCalled()
  })

  it("atualiza bcrypt de custo 10 após autenticação válida", async () => {
    m.usuario.findUnique.mockResolvedValue({ id: 1, ativo: true, senha: "$2b$10$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", nome: "Admin", role: "admin" })
    compare.mockResolvedValue(true)

    expect(await checkDbCredentials("admin", "senha")).toEqual({ ok: true, nome: "Admin", role: "admin" })
    expect(hashSync).toHaveBeenCalledWith("senha", 12)
    expect(m.usuario.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { senha: "bcrypt-hash" } })
  })
})
