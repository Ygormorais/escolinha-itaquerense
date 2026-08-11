import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db: Record<string, unknown> = {
    preMatricula: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), delete: vi.fn() },
    aluno: { create: vi.fn() },
    responsavel: { findFirst: vi.fn() },
    log: { create: vi.fn() },
    pagamento: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
  }
  db.$transaction = vi.fn(async (cb: (tx: typeof db) => unknown) => cb(db))
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/matricula-files", () => ({ deleteMatriculaDocuments: vi.fn().mockResolvedValue(0) }))

import { aprovarPreMatricula, criarPreMatricula, deletarPreMatricula } from "@/app/actions/matricula"
import { db } from "@/lib/db"
import { deleteMatriculaDocuments } from "@/lib/matricula-files"

const m = db as unknown as {
  preMatricula: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
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
  m.preMatricula.create.mockResolvedValue({ id: 5 })
  m.responsavel.findFirst.mockResolvedValue(null)
})

describe("criarPreMatricula — sanitização de documentos", () => {
  const base = {
    nomeAluno: "Ana", dataNascimento: "2016-05-01", turma: "Sub-9", horario: "x",
    nomeResponsavel: "Mãe", telefone: "11999998888", email: "m@e.com", consentimento: true,
  }

  it("mantém só uploads internos e descarta URLs arbitrárias/javascript:", async () => {
    await criarPreMatricula({
      ...base,
      documentos: ["/uploads/matriculas/a.pdf", "javascript:alert(1)", "https://evil.com/x", "/uploads/matriculas/b.jpg"],
    })
    const data = m.preMatricula.create.mock.calls[0][0].data
    expect(JSON.parse(data.documentos)).toEqual(["/uploads/matriculas/a.pdf", "/uploads/matriculas/b.jpg"])
  })

  it("grava documentos nulo quando nenhum é um upload interno válido", async () => {
    await criarPreMatricula({ ...base, documentos: ["javascript:alert(1)", "../../etc/passwd"] })
    const data = m.preMatricula.create.mock.calls[0][0].data
    expect(data.documentos).toBeNull()
  })
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
      data: { status: "aprovada", decididoEm: expect.any(Date) },
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

  it("gera 3 mensalidades quando meses = 3", async () => {
    const createSpy = vi.fn().mockResolvedValue({ id: 5 })
    ;(db as unknown as Record<string, unknown>).pagamento = { create: createSpy }

    await aprovarPreMatricula(1, { mensalidade: 200, meses: 3 })

    expect(createSpy).toHaveBeenCalledTimes(3)
    const mesesRef = createSpy.mock.calls.map((c) => (c[0] as { data: { mesReferencia: string } }).data.mesReferencia)
    expect(mesesRef).toHaveLength(3)
    // Todos devem ser strings "YYYY-MM"
    mesesRef.forEach((m: string) => expect(m).toMatch(/^\d{4}-\d{2}$/))
  })

  it("nao gera mensalidades quando meses = 0", async () => {
    const createSpy = vi.fn().mockResolvedValue({ id: 5 })
    ;(db as unknown as Record<string, unknown>).pagamento = { create: createSpy }

    await aprovarPreMatricula(1, { mensalidade: 200, meses: 0 })
    expect(createSpy).not.toHaveBeenCalled()
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
      consentimento: true,
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
      consentimento: true,
    })
    expect(res).toEqual({ success: true })
    expect(m.preMatricula.create.mock.calls[0][0].data).toMatchObject({
      consentimentoEm: expect.any(Date),
      consentimentoVersao: "2026-08-11",
    })
  })

  it("rejeita envio sem consentimento explícito", async () => {
    const res = await criarPreMatricula({
      nomeAluno: "João", dataNascimento: "2015-04-10", turma: "Sub-11", horario: "10h",
      nomeResponsavel: "Maria", telefone: "11999998888", email: "", consentimento: false,
    })
    expect(res).toEqual({ error: "É necessário autorizar o tratamento dos dados para enviar a pré-matrícula" })
    expect(m.preMatricula.create).not.toHaveBeenCalled()
  })
})

describe("deletarPreMatricula", () => {
  it("remove os documentos antes do registro", async () => {
    m.preMatricula.findUnique.mockResolvedValue({ documentos: '["/uploads/matriculas/doc.pdf"]' })
    m.preMatricula.delete.mockResolvedValue({ id: 1 })
    await expect(deletarPreMatricula(1)).resolves.toEqual({ success: true })
    expect(deleteMatriculaDocuments).toHaveBeenCalledWith('["/uploads/matriculas/doc.pdf"]')
    expect(m.preMatricula.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    expect((deleteMatriculaDocuments as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0])
      .toBeLessThan(m.preMatricula.delete.mock.invocationCallOrder[0])
  })

  it("mantém o registro quando a exclusão física falha", async () => {
    m.preMatricula.findUnique.mockResolvedValue({ documentos: '["/uploads/matriculas/doc.pdf"]' })
    ;(deleteMatriculaDocuments as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("EACCES"))
    await expect(deletarPreMatricula(1)).resolves.toEqual({ error: "EACCES" })
    expect(m.preMatricula.delete).not.toHaveBeenCalled()
  })
})
