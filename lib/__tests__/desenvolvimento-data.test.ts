import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ alunos: vi.fn(), acoes: vi.fn() }))
vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({ db: { aluno: { findMany: mocks.alunos }, acaoDesenvolvimento: { findMany: mocks.acoes } } }))
import { carregarPainelDesenvolvimento } from "@/lib/desenvolvimento-data"

describe("histórico de desenvolvimento", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.alunos.mockResolvedValue([])
    mocks.acoes.mockResolvedValue([{
      id: 1, alunoId: 12, aluno: { nome: "Atleta", turma: "Sub-13" },
      insightKey: "12:baixa_frequencia:2026-08-24", titulo: "Frequência", tipo: "baixa_frequencia",
      status: "concluida", observacao: "Família contatada", usuario: "tecnico",
      planoSemanal: '["Revisar frequência"]', updatedAt: new Date("2026-08-28T15:00:00Z"),
    }])
  })

  it("preserva ciclos anteriores mesmo sem indicador ativo na semana atual", async () => {
    const painel = await carregarPainelDesenvolvimento({ now: new Date("2026-08-31T15:00:00Z") })
    expect(painel.insights).toEqual([])
    expect(painel.historico[0]).toMatchObject({ cicloInicio: "2026-08-24", observacao: "Família contatada", planoSemanal: ["Revisar frequência"] })
    expect(mocks.acoes).toHaveBeenCalledWith(expect.objectContaining({ take: 40, orderBy: { updatedAt: "desc" } }))
  })

  it("restringe histórico do passaporte ao aluno solicitado e limita a 12 ciclos", async () => {
    await carregarPainelDesenvolvimento({ alunoId: 12 })
    expect(mocks.acoes).toHaveBeenCalledWith(expect.objectContaining({ where: { alunoId: 12 }, take: 12 }))
  })

  it("não quebra o histórico quando um plano antigo contém JSON inválido", async () => {
    const rows = await mocks.acoes()
    mocks.acoes.mockResolvedValue([{ ...rows[0], planoSemanal: "inválido" }])
    const painel = await carregarPainelDesenvolvimento()
    expect(painel.historico[0].planoSemanal).toBeNull()
  })

  it("usa o mesmo recorte de jogos no painel e no indicador acionável", async () => {
    const now = new Date("2026-08-31T15:00:00Z")
    const data = new Date("2026-08-20T15:00:00Z")
    mocks.alunos.mockResolvedValue([{
      id: 1, nome: "Atleta", turma: "Sub-13", dataMatricula: new Date("2025-01-01"),
      frequencias: [1, 2, 3, 4].map(() => ({ data, presenca: "Presente" })),
      avaliacoes: [], escalacoes: [{ partida: { id: 999, data } }],
      inscricoes: [{ createdAt: new Date("2026-08-01"), campeonato: { partidas: [
        { id: 1, data, resultado: "Vitoria" },
        { id: 2, data, resultado: null },
        { id: 3, data: new Date("2026-07-20"), resultado: "Empate" },
      ] } }],
    }])
    const painel = await carregarPainelDesenvolvimento({ now })
    expect(painel.oportunidades[0]).toMatchObject({ jogos: 1, convocacoes: 0, situacao: "revisar" })
    expect(painel.insights.find((item) => item.tipo === "poucas_oportunidades")?.evidencias).toContain("0 convocações em 1 jogo(s) registrado(s) no período")
    expect(mocks.alunos).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "Ativo" } }))
  })
})
