import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db: Record<string, unknown> = {
    preMatricula: { findUnique: vi.fn(), update: vi.fn() },
    aluno: { create: vi.fn() },
    responsavel: { findFirst: vi.fn() },
    log: { create: vi.fn() },
  }
  db.$transaction = vi.fn(async (cb: (tx: typeof db) => unknown) => cb(db))
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { aprovarPreMatricula, criarPreMatricula } from "@/app/actions/matricula"
import { db } from "@/lib/db"

const m = db as unknown as {
  preMatricula: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  aluno: { create: ReturnType<typeof vi.fn> }
  responsavel: { findFirst: ReturnType<typeof vi.fn> }
}

const prePendente = {
  id: 1,
  nomeAluno: "João Silva",
  dataNascimento: new Date("2015-04-10"),
  turma: "Sub-11",
  horario: "Seg/Qua 10h",
  nomeResponsavel: "Maria Silva",
  telefone: "(11) 99999-8888",
  email: "maria@email.com",
  documentos: null,
  observacoes: "Alergia a amendoim",
  status: "pendente",
  createdAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  m.preMatricula.findUnique.mockResolvedValue(prePendente)
  m.preMatricula.update.mockResolvedValue({ ...prePendente, status: "aprovada" })
  m.aluno.create.mockResolvedValue({ id: 99 })
  m.responsavel.findFirst.mockResolvedValue(null)
})

describe("aprovarPreMatricula", () => {
  it("cria o aluno com campos mapeados e status Ativo, e marca aprovada", async () => {
    const res = await aprovarPreMatricula(1, { mensalidade: 200 })
    expect(res).toEqual({ success: true, alunoId: 99 })

    const data = m.aluno.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      nome: "João Silva",
      turma: "Sub-11",
      horario: "Seg/Qua 10h",
      responsavel: "Maria Silva",
      telefone: "(11) 99999-8888",
      email: "maria@email.com",
      observacoes: "Alergia a amendoim",
      mensalidade: 200,
      desconto: 0,
      status: "Ativo",
    })
    expect(data.dataMatricula).toBeInstanceOf(Date)
    expect(m.preMatricula.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: "aprovada" },
    })
  })

  it("aplica desconto quando informado", async () => {
    await aprovarPreMatricula(1, { mensalidade: 200, desconto: 30 })
    expect(m.aluno.create.mock.calls[0][0].data.desconto).toBe(30)
  })

  it("vincula responsavelId quando existe Responsavel com mesmo email", async () => {
    m.responsavel.findFirst.mockResolvedValue({ id: 7 })
    await aprovarPreMatricula(1, { mensalidade: 200 })
    expect(m.responsavel.findFirst).toHaveBeenCalledWith({ where: { email: "maria@email.com" } })
    expect(m.aluno.create.mock.calls[0][0].data.responsavelId).toBe(7)
  })

  it("deixa responsavelId nulo quando nao ha Responsavel correspondente", async () => {
    await aprovarPreMatricula(1, { mensalidade: 200 })
    expect(m.aluno.create.mock.calls[0][0].data.responsavelId).toBeNull()
  })

  it("e idempotente: ja aprovada retorna erro e nao cria aluno", async () => {
    m.preMatricula.findUnique.mockResolvedValue({ ...prePendente, status: "aprovada" })
    const res = await aprovarPreMatricula(1, { mensalidade: 200 })
    expect(res).toEqual({ error: "Pré-matrícula já aprovada" })
    expect(m.aluno.create).not.toHaveBeenCalled()
  })

  it("rejeita mensalidade ausente, negativa ou NaN sem escrever no banco", async () => {
    for (const valor of [undefined, -10, Number.NaN]) {
      const res = await aprovarPreMatricula(1, { mensalidade: valor as number })
      expect(res).toEqual({ error: "Informe uma mensalidade válida" })
    }
    expect(m.aluno.create).not.toHaveBeenCalled()
    expect(m.preMatricula.update).not.toHaveBeenCalled()
  })

  it("retorna erro quando a pre-matricula nao existe", async () => {
    m.preMatricula.findUnique.mockResolvedValue(null)
    const res = await aprovarPreMatricula(404, { mensalidade: 200 })
    expect(res).toEqual({ error: "Pré-matrícula não encontrada" })
    expect(m.aluno.create).not.toHaveBeenCalled()
  })

  it("retorna erro quando a criacao do aluno falha", async () => {
    m.aluno.create.mockRejectedValue(new Error("UNIQUE constraint failed"))
    const res = await aprovarPreMatricula(1, { mensalidade: 200 })
    expect(res).toEqual({ error: "UNIQUE constraint failed" })
  })
})

describe("criarPreMatricula", () => {
  it("rejeita quando faltam campos obrigatorios", async () => {
    const res = await criarPreMatricula({
      nomeAluno: "",
      dataNascimento: "2015-04-10",
      turma: "Sub-11",
      horario: "Seg/Qua 10h",
      nomeResponsavel: "Maria",
      telefone: "",
      email: "maria@email.com",
    })
    expect(res).toEqual({ error: "Preencha os campos obrigatórios" })
  })

  it("cria com status pendente quando valido", async () => {
    ;(m as unknown as { preMatricula: { create: ReturnType<typeof vi.fn> } }).preMatricula.create =
      vi.fn().mockResolvedValue({ id: 5 })
    const res = await criarPreMatricula({
      nomeAluno: "João",
      dataNascimento: "2015-04-10",
      turma: "Sub-11",
      horario: "Seg/Qua 10h",
      nomeResponsavel: "Maria",
      telefone: "(11) 99999-8888",
      email: "maria@email.com",
    })
    expect(res).toEqual({ success: true })
  })
})
