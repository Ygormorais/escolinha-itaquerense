import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    responsavel: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    aluno: { update: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("bcryptjs", () => ({ default: { hashSync: vi.fn(() => "hashed-senha") } }))

import { criarResponsavel, editarResponsavel } from "@/app/actions/responsaveis"
import { db } from "@/lib/db"

const m = db as unknown as {
  responsavel: {
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.responsavel.findUnique.mockResolvedValue(null)
  m.responsavel.findFirst.mockResolvedValue(null)
  m.responsavel.create.mockResolvedValue({ id: 10 })
  m.responsavel.update.mockResolvedValue({})
})

describe("criarResponsavel", () => {
  const input = { nome: "Maria", email: "maria@x.com", telefone: "(11) 90000-0000", senha: "segredo123" }

  it("rejeita email já cadastrado sem criar", async () => {
    m.responsavel.findUnique.mockResolvedValue({ id: 1 })
    const res = await criarResponsavel(input)
    expect(res).toEqual({ error: "Email já cadastrado" })
    expect(m.responsavel.create).not.toHaveBeenCalled()
  })

  it("faz hash da senha e conecta alunos quando informados", async () => {
    const res = await criarResponsavel({ ...input, alunoIds: [1, 2] })
    expect(res).toEqual({ success: true, id: 10 })
    const data = m.responsavel.create.mock.calls[0][0].data
    expect(data.senha).toBe("hashed-senha")
    expect(data.alunos).toEqual({ connect: [{ id: 1 }, { id: 2 }] })
  })

  it("não conecta alunos quando a lista é vazia/ausente", async () => {
    await criarResponsavel(input)
    expect(m.responsavel.create.mock.calls[0][0].data.alunos).toBeUndefined()
  })
})

describe("editarResponsavel — validação de CPF", () => {
  it("cpf vazio vira null (sem validação)", async () => {
    const res = await editarResponsavel(1, { cpf: "" })
    expect(res).toEqual({ success: true })
    expect(m.responsavel.update.mock.calls[0][0].data.cpf).toBeNull()
  })

  it("rejeita CPF com tamanho inválido", async () => {
    const res = await editarResponsavel(1, { cpf: "123" })
    expect(res).toEqual({ error: "CPF deve ter 11 dígitos" })
    expect(m.responsavel.update).not.toHaveBeenCalled()
  })

  it("rejeita CPF duplicado em outro responsável", async () => {
    m.responsavel.findFirst.mockResolvedValue({ id: 99 })
    const res = await editarResponsavel(1, { cpf: "123.456.789-09" })
    expect(res).toEqual({ error: "CPF já cadastrado para outro responsável" })
    expect(m.responsavel.update).not.toHaveBeenCalled()
  })

  it("normaliza o CPF (só dígitos) e salva quando único", async () => {
    const res = await editarResponsavel(1, { nome: "Nova", cpf: "123.456.789-09" })
    expect(res).toEqual({ success: true })
    expect(m.responsavel.update.mock.calls[0][0].data.cpf).toBe("12345678909")
  })

  it("atualiza direto quando não há campo cpf", async () => {
    const res = await editarResponsavel(1, { nome: "Só nome" })
    expect(res).toEqual({ success: true })
    expect(m.responsavel.update).toHaveBeenCalled()
  })
})
