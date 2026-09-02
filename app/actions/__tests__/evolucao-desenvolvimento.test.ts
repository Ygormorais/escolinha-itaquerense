import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  usuarioFindMany: vi.fn(),
  acaoFindMany: vi.fn(),
  planoFindMany: vi.fn(),
  planoCount: vi.fn(),
  pautaFindMany: vi.fn(),
  alunoFindMany: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ requireAuth: mocks.requireAuth }))
vi.mock("@/lib/db", () => ({
  db: {
    usuario: { findMany: mocks.usuarioFindMany },
    acaoDesenvolvimento: { findMany: mocks.acaoFindMany },
    planoTreino: { findMany: mocks.planoFindMany, count: mocks.planoCount },
    pautaSemanal: { findMany: mocks.pautaFindMany },
    aluno: { findMany: mocks.alunoFindMany },
  },
}))

import {
  consultarAtividadeSemanalComissao,
  consultarComparativoDesenvolvimento,
  consultarEvolucaoColetiva,
  consultarSugestoesLocaisTreino,
} from "../evolucao-desenvolvimento"

describe("evolução e apoio local à comissão", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-02T12:00:00Z"))
    vi.clearAllMocks()
    mocks.requireAuth.mockResolvedValue({ user: "tecnico", role: "tecnico" })
  })

  afterEach(() => vi.useRealTimers())

  it("consolida atividade semanal por integrante e preserva ações sem autoria", async () => {
    mocks.usuarioFindMany.mockResolvedValue([
      { username: "bia", nome: "Beatriz", role: "tecnico" },
      { username: "ana", nome: "Ana", role: "admin" },
    ])
    mocks.acaoFindMany.mockResolvedValue([
      { usuario: "bia", status: "pendente" },
      { usuario: "bia", status: "concluida" },
      { usuario: "ana", status: "ignorada" },
      { usuario: null, status: "pendente" },
    ])
    mocks.planoFindMany.mockResolvedValue([
      { usuario: "bia", retornos: [{ id: 1 }] },
      { usuario: "ana", retornos: [] },
    ])
    mocks.pautaFindMany.mockResolvedValue([{ usuario: "bia" }])

    const resultado = await consultarAtividadeSemanalComissao({ turma: "Sub-13" })

    expect(mocks.requireAuth).toHaveBeenCalledWith(["admin", "tecnico"])
    expect(resultado).toMatchObject({
      dados: {
        cicloInicio: "2026-08-31",
        cicloFim: "2026-09-06",
        semAutoria: 1,
        integrantes: [
          { usuario: "ana", acoes: { pendentes: 0, concluidas: 0, ignoradas: 1 }, planos: 1, planosComRetorno: 0, pautas: 0 },
          { usuario: "bia", acoes: { pendentes: 1, concluidas: 1, ignoradas: 0 }, planos: 1, planosComRetorno: 1, pautas: 1 },
        ],
      },
    })
  })

  it("compara turmas e faixas etárias com frequência, avaliações e planos", async () => {
    mocks.alunoFindMany.mockResolvedValue([
      {
        turma: "Sub-11",
        dataNascimento: new Date("2016-09-03T00:00:00Z"),
        frequencias: [{ presenca: "Presente" }, { presenca: "Ausente" }],
        avaliacoes: [{ id: 1 }],
        acoesDesenvolvimento: [{ status: "pendente" }, { status: "concluida" }],
      },
      {
        turma: "Sub-11",
        dataNascimento: new Date("2015-01-01T00:00:00Z"),
        frequencias: [{ presenca: "Justificado" }],
        avaliacoes: [],
        acoesDesenvolvimento: [{ status: "ignorada" }],
      },
      {
        turma: "Sub-17",
        dataNascimento: new Date("2009-01-01T00:00:00Z"),
        frequencias: [],
        avaliacoes: [],
        acoesDesenvolvimento: [],
      },
    ])
    mocks.planoFindMany.mockResolvedValue([
      { turma: "Sub-11", retornos: [{ id: 1 }] },
      { turma: "Sub-11", retornos: [] },
    ])

    const resultado = await consultarComparativoDesenvolvimento({ periodoDias: 30 })

    expect(resultado.dados?.porTurma).toEqual(expect.arrayContaining([
      expect.objectContaining({ nome: "Sub-11", atletas: 2, avaliados: 1, planos: 2, planosComRetorno: 1 }),
      expect.objectContaining({ nome: "Sub-17", atletas: 1, frequencia: expect.objectContaining({ percentualPresenca: null }) }),
    ]))
    expect(resultado.dados?.porFaixa.map((item) => item.nome)).toEqual(["9–11", "16–17"])
  })

  it("gera série coletiva e só divulga médias com ao menos três notas", async () => {
    const frequencias = [
      { data: new Date("2026-08-10T12:00:00Z"), presenca: "Presente" },
      { data: new Date("2026-08-17T12:00:00Z"), presenca: "Ausente" },
      { data: new Date("2026-09-01T12:00:00Z"), presenca: "Presente" },
    ]
    mocks.alunoFindMany.mockResolvedValue([
      { id: 1, frequencias, avaliacoes: [{ periodo: "2026-2", notaTecnica: 8, notaFisica: 7, notaComportamento: 9 }] },
      { id: 2, frequencias: [frequencias[0]], avaliacoes: [{ periodo: "2026-2", notaTecnica: 7, notaFisica: 6, notaComportamento: null }] },
      { id: 3, frequencias: [frequencias[2]], avaliacoes: [{ periodo: "2026-2", notaTecnica: 9, notaFisica: 8, notaComportamento: 8 }] },
    ])

    const resultado = await consultarEvolucaoColetiva({ turma: "Sub-13", meses: 6 })
    const avaliacao = resultado.dados?.avaliacoesPorPeriodo[0]

    expect(resultado.dados).toMatchObject({ turma: "Sub-13", atletasAtivos: 3, variacaoPresenca: 33.3 })
    expect(avaliacao).toMatchObject({ atletasAvaliados: 3, tecnica: 8, fisica: 7, comportamento: null })
  })

  it("produz sugestões explicáveis sem API paga a partir dos registros locais", async () => {
    mocks.alunoFindMany.mockResolvedValue([
      {
        frequencias: [{ presenca: "Presente" }, { presenca: "Ausente" }, { presenca: "Ausente" }],
        avaliacoes: [],
        acoesDesenvolvimento: [{ id: 1 }, { id: 2 }],
      },
      {
        frequencias: [{ presenca: "Ausente" }, { presenca: "Justificado" }],
        avaliacoes: [],
        acoesDesenvolvimento: [{ id: 3 }],
      },
    ])
    mocks.planoCount.mockResolvedValueOnce(3).mockResolvedValueOnce(1)

    const resultado = await consultarSugestoesLocaisTreino({ turma: "Sub-13" })

    expect(resultado.dados?.criterios).toMatchObject({ atletasAtivos: 2, percentualPresenca: 20, acoesPendentes: 3, planosSemRetorno: 2 })
    expect(resultado.dados?.sugestoes.map((item) => item.id)).toEqual(["participacao", "observacao", "acoes", "retornos"])
  })

  it("trata filtros inválidos e turma sem atletas", async () => {
    await expect(consultarAtividadeSemanalComissao({ turma: "x".repeat(101) })).resolves.toEqual({ error: "Turma inválida." })
    await expect(consultarComparativoDesenvolvimento({ periodoDias: 45 as 30 })).resolves.toEqual({ error: "Período inválido." })
    await expect(consultarEvolucaoColetiva({ turma: "", meses: 6 })).resolves.toEqual({ error: "Selecione uma turma e um período válidos." })
    await expect(consultarSugestoesLocaisTreino({ turma: "" })).resolves.toEqual({ error: "Selecione uma turma válida." })

    mocks.alunoFindMany.mockResolvedValue([])
    mocks.planoCount.mockResolvedValue(0)
    const vazio = await consultarSugestoesLocaisTreino({ turma: "Sub-9" })
    expect(vazio.dados?.sugestoes).toEqual([expect.objectContaining({ id: "sem-atletas" })])
  })
})
