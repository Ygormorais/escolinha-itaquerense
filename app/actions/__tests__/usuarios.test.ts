import { describe, it, expect, beforeEach, vi } from "vitest"
import { createHmac } from "crypto"

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

vi.mock("@/lib/env", () => ({ getSessionSecret: () => "test-secret" }))

vi.mock("bcryptjs", () => ({
  default: { hashSync: vi.fn(() => "bcrypt-hash"), compare: vi.fn() },
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
    m.usuario.findUnique.mockResolvedValue({ id: 1, ativo: true, senha: "bcrypt-hash", nome: "Admin", role: "admin" })
    compare.mockResolvedValue(true)
    expect(await checkDbCredentials("admin", "senha")).toEqual({ ok: true, nome: "Admin", role: "admin" })
    expect(m.usuario.update).not.toHaveBeenCalled()
  })

  it("aceita hash legado (HMAC) e migra para bcrypt", async () => {
    const senha = "senha-antiga"
    const legacy = createHmac("sha256", "test-secret").update(senha).digest("hex")
    m.usuario.findUnique.mockResolvedValue({ id: 7, ativo: true, senha: legacy, nome: "Velho", role: "secretaria" })
    compare.mockResolvedValue(false) // não bate como bcrypt

    const res = await checkDbCredentials("velho", senha)
    expect(res).toEqual({ ok: true, nome: "Velho", role: "secretaria" })
    // re-hash gravado
    expect(m.usuario.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { senha: "bcrypt-hash" } })
  })

  it("falha quando nem bcrypt nem legado batem", async () => {
    m.usuario.findUnique.mockResolvedValue({ id: 1, ativo: true, senha: "algo-diferente", nome: "N", role: "admin" })
    compare.mockResolvedValue(false)
    expect(await checkDbCredentials("x", "errada")).toEqual({ ok: false })
    expect(m.usuario.update).not.toHaveBeenCalled()
  })
})
