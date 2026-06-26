import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    aluno: { create: vi.fn(), update: vi.fn() },
    pagamento: { createMany: vi.fn() },
  },
}))
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))
vi.mock("@/lib/config", () => ({ getConfig: vi.fn().mockReturnValue({ nome: "Escolinha", whatsapp: "" }) }))
vi.mock("@/lib/whatsapp/provider", () => ({ getWhatsAppProvider: vi.fn().mockReturnValue({ sendText: vi.fn() }) }))

import { createAluno, updateAluno, inativarAluno, reativarAluno } from "@/app/actions/alunos"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const m = db as unknown as {
  aluno: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  pagamento: { createMany: ReturnType<typeof vi.fn> }
}

const dadosValidos = {
  nome: "João Silva",
  dataNascimento: "2015-03-10",
  turma: "Sub-11",
  horario: "08:00",
  responsavel: "Maria Silva",
  telefone: "11999998888",
  email: "maria@email.com",
  dataMatricula: "2024-01-01",
  mensalidade: 150,
  status: "Ativo",
}

beforeEach(() => {
  vi.clearAllMocks()
  m.aluno.create.mockResolvedValue({ id: 42, nome: dadosValidos.nome, turma: dadosValidos.turma })
  m.aluno.update.mockResolvedValue({ id: 42, nome: dadosValidos.nome, turma: dadosValidos.turma })
  m.pagamento.createMany.mockResolvedValue({ count: 12 })
})

describe("updateAluno — validação espelha createAluno", () => {
  it("rejeita nome vazio sem atualizar", async () => {
    const res = await updateAluno(1, { ...dadosValidos, nome: "   " })
    expect(res).toEqual({ error: "Nome deve ter pelo menos 3 caracteres" })
    expect(m.aluno.update).not.toHaveBeenCalled()
  })

  it("rejeita mensalidade negativa sem atualizar", async () => {
    const res = await updateAluno(1, { ...dadosValidos, mensalidade: -10 })
    expect(res).toEqual({ error: "Mensalidade inválida" })
    expect(m.aluno.update).not.toHaveBeenCalled()
  })
})

describe("createAluno", () => {
  it("exige autenticação", async () => {
    await createAluno(dadosValidos)
    expect(requireAuth).toHaveBeenCalled()
  })

  it("cria o aluno com db.aluno.create e os campos corretos", async () => {
    const res = await createAluno(dadosValidos)
    expect(res).toEqual({ success: true })
    expect(m.aluno.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nome: "João Silva",
          turma: "Sub-11",
          status: "Ativo",
          desconto: 0,
        }),
      })
    )
  })

  it("aplica desconto=0 como padrão quando não informado", async () => {
    await createAluno(dadosValidos)
    expect(m.aluno.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ desconto: 0 }),
      })
    )
  })

  it("cria 12 pagamentos via db.pagamento.createMany", async () => {
    await createAluno(dadosValidos)
    expect(m.pagamento.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ alunoId: 42 }),
        ]),
      })
    )
    const callArg = m.pagamento.createMany.mock.calls[0][0]
    expect(callArg.data).toHaveLength(12)
  })

  it("retorna { success: true }", async () => {
    const res = await createAluno(dadosValidos)
    expect(res).toEqual({ success: true })
  })

  it("erro do db retorna { error: string }", async () => {
    m.aluno.create.mockRejectedValue(new Error("DB offline"))
    const res = await createAluno(dadosValidos)
    expect(res).toEqual({ error: "DB offline" })
    expect((res as { error: string }).error).toBeTypeOf("string")
  })
})

describe("updateAluno", () => {
  it("exige autenticação", async () => {
    await updateAluno(42, dadosValidos)
    expect(requireAuth).toHaveBeenCalled()
  })

  it("chama db.aluno.update com where: { id } e os campos corretos", async () => {
    const res = await updateAluno(42, dadosValidos)
    expect(res).toEqual({ success: true })
    expect(m.aluno.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 42 },
        data: expect.objectContaining({
          nome: "João Silva",
          turma: "Sub-11",
          status: "Ativo",
        }),
      })
    )
  })

  it("retorna { success: true }", async () => {
    const res = await updateAluno(42, dadosValidos)
    expect(res).toEqual({ success: true })
  })
})

describe("inativarAluno", () => {
  it("exige autenticação", async () => {
    await inativarAluno(42)
    expect(requireAuth).toHaveBeenCalled()
  })

  it("chama db.aluno.update com data: { status: 'Inativo' }", async () => {
    await inativarAluno(42)
    expect(m.aluno.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 42 },
        data: { status: "Inativo" },
      })
    )
  })

  it("retorna { success: true }", async () => {
    const res = await inativarAluno(42)
    expect(res).toEqual({ success: true })
  })
})

describe("reativarAluno", () => {
  it("exige autenticação", async () => {
    await reativarAluno(42)
    expect(requireAuth).toHaveBeenCalled()
  })

  it("chama db.aluno.update com data: { status: 'Ativo' }", async () => {
    await reativarAluno(42)
    expect(m.aluno.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 42 },
        data: { status: "Ativo" },
      })
    )
  })

  it("retorna { success: true }", async () => {
    const res = await reativarAluno(42)
    expect(res).toEqual({ success: true })
  })
})
