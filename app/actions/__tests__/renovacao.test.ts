import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    aluno: { findFirst: vi.fn() },
    renovacaoMatricula: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("@/lib/responsavel-session", () => ({
  getResponsavelSession: vi.fn().mockResolvedValue({ authenticated: true, responsavelId: 1 }),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { solicitarRenovacao, listarRenovacoesResponsavel, adminListarRenovacoes, responderRenovacao } from "@/app/actions/renovacao"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

const m = db as unknown as {
  aluno: { findFirst: ReturnType<typeof vi.fn> }
  renovacaoMatricula: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.aluno.findFirst.mockResolvedValue({ id: 1 })
  m.renovacaoMatricula.findUnique.mockResolvedValue(null)
  m.renovacaoMatricula.create.mockResolvedValue({})
  m.renovacaoMatricula.findMany.mockResolvedValue([])
  m.renovacaoMatricula.update.mockResolvedValue({})
})

describe("solicitarRenovacao", () => {
  it("retorna erro se sessão não autenticada", async () => {
    vi.mocked(getResponsavelSession).mockResolvedValueOnce({ authenticated: false })
    const res = await solicitarRenovacao(1, "2026-2S")
    expect(res).toEqual({ error: "Não autenticado." })
  })

  it("retorna erro se aluno não pertence ao responsável", async () => {
    m.aluno.findFirst.mockResolvedValueOnce(null)
    const res = await solicitarRenovacao(99, "2026-2S")
    expect(res).toEqual({ error: "Aluno não encontrado." })
  })

  it("retorna erro se já existe renovação para o período", async () => {
    m.renovacaoMatricula.findUnique.mockResolvedValueOnce({ id: 1 })
    const res = await solicitarRenovacao(1, "2026-2S")
    expect(res).toEqual({ error: "Já existe uma solicitação de renovação para este período." })
    expect(m.renovacaoMatricula.create).not.toHaveBeenCalled()
  })

  it("cria renovação com sucesso", async () => {
    const res = await solicitarRenovacao(1, "2026-2S", "Sem observações")
    expect(res).toEqual({ success: true })
    expect(m.renovacaoMatricula.create).toHaveBeenCalledWith({
      data: { alunoId: 1, responsavelId: 1, periodo: "2026-2S", observacoes: "Sem observações" },
    })
  })

  it("cria renovação sem observações", async () => {
    const res = await solicitarRenovacao(1, "2026-2S")
    expect(res).toEqual({ success: true })
    expect(m.renovacaoMatricula.create).toHaveBeenCalledWith({
      data: { alunoId: 1, responsavelId: 1, periodo: "2026-2S", observacoes: undefined },
    })
  })
})

describe("listarRenovacoesResponsavel", () => {
  it("retorna [] se não autenticado", async () => {
    vi.mocked(getResponsavelSession).mockResolvedValueOnce({ authenticated: false })
    const res = await listarRenovacoesResponsavel()
    expect(res).toEqual([])
  })

  it("busca renovações do responsável logado", async () => {
    const mock = [{ id: 1, periodo: "2026-2S", aluno: { nome: "João", turma: "Sub-13" } }]
    m.renovacaoMatricula.findMany.mockResolvedValueOnce(mock)
    const res = await listarRenovacoesResponsavel()
    expect(res).toEqual(mock)
    expect(m.renovacaoMatricula.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { responsavelId: 1 } })
    )
  })
})

describe("adminListarRenovacoes", () => {
  it("filtra por status quando fornecido", async () => {
    await adminListarRenovacoes("aprovada")
    expect(m.renovacaoMatricula.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "aprovada" } })
    )
  })

  it("não filtra quando status é 'todas'", async () => {
    await adminListarRenovacoes("todas")
    expect(m.renovacaoMatricula.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it("não filtra quando status é undefined", async () => {
    await adminListarRenovacoes()
    expect(m.renovacaoMatricula.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })
})

describe("responderRenovacao", () => {
  it("aprova renovação", async () => {
    const res = await responderRenovacao(1, "aprovada", "Tudo certo!")
    expect(res).toEqual({ success: true })
    expect(m.renovacaoMatricula.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: "aprovada", resposta: "Tudo certo!" },
    })
  })

  it("recusa renovação", async () => {
    const res = await responderRenovacao(2, "recusada")
    expect(res).toEqual({ success: true })
    expect(m.renovacaoMatricula.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { status: "recusada", resposta: null },
    })
  })

  it("trata resposta vazia como null", async () => {
    const res = await responderRenovacao(1, "aprovada", "   ")
    expect(res).toEqual({ success: true })
    expect(m.renovacaoMatricula.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ resposta: null }) })
    )
  })
})
