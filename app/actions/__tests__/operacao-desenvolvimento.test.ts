import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
const m = vi.hoisted(() => ({ session: vi.fn(), planoCount: vi.fn(), planos: vi.fn(), acaoCount: vi.fn(), acoes: vi.fn(), pubCount: vi.fn(), pubs: vi.fn(), alunoCount: vi.fn(), freqGroup: vi.fn(), acaoGroup: vi.fn(), transaction: vi.fn() }))
vi.mock("@/lib/session", () => ({ getSession: m.session }))
vi.mock("@/lib/db", () => ({ db: {
  planoTreino: { count: m.planoCount, findMany: m.planos }, acaoDesenvolvimento: { count: m.acaoCount, findMany: m.acoes, groupBy: m.acaoGroup },
  publicacaoResumo: { count: m.pubCount, findMany: m.pubs }, aluno: { count: m.alunoCount }, frequencia: { groupBy: m.freqGroup }, $transaction: m.transaction,
} }))
import { consultarPendenciasOperacionais, consultarRelatorioGerencial } from "@/app/actions/operacao-desenvolvimento"

describe("operação e relatório de desenvolvimento", () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-01T15:00:00Z"))
    m.session.mockResolvedValue({ authenticated: true, user: "tec", role: "tecnico" })
    m.planoCount.mockResolvedValue(0); m.planos.mockResolvedValue([]); m.acaoCount.mockResolvedValue(0); m.acoes.mockResolvedValue([]); m.pubCount.mockResolvedValue(0); m.pubs.mockResolvedValue([]); m.alunoCount.mockResolvedValue(0); m.freqGroup.mockResolvedValue([]); m.acaoGroup.mockResolvedValue([])
    m.transaction.mockImplementation((queries) => Promise.all(queries))
  })
  afterEach(() => vi.useRealTimers())
  it.each(["secretaria", "responsavel", undefined])("bloqueia perfil %s antes de ler dados", async (role) => {
    m.session.mockResolvedValue({ authenticated: true, user: "x", role })
    await expect(consultarPendenciasOperacionais()).rejects.toThrow("Acesso não autorizado")
    await expect(consultarRelatorioGerencial()).rejects.toThrow("Acesso não autorizado")
    expect(m.transaction).not.toHaveBeenCalled(); expect(m.alunoCount).not.toHaveBeenCalled()
  })
  it.each([101, "x".repeat(101)])("recusa turma inválida antes da consulta", async (turma) => {
    expect(await consultarPendenciasOperacionais({ turma: turma as string })).toHaveProperty("error")
    expect(await consultarRelatorioGerencial({ turma: turma as string })).toHaveProperty("error")
    expect(m.transaction).not.toHaveBeenCalled()
  })
  it("centraliza três pendências com total real e limite explícito", async () => {
    m.planoCount.mockResolvedValue(31); m.acaoCount.mockResolvedValue(32); m.pubCount.mockResolvedValue(33)
    const r = await consultarPendenciasOperacionais({ turma: "Sub-11" })
    expect(r.dados).toMatchObject({ limite: 20, planos: { total: 31 }, acoes: { total: 32 }, publicacoes: { total: 33 } })
    expect(m.planos.mock.calls[0][0]).toMatchObject({ where: { turma: "Sub-11", retornos: { none: {} } }, take: 20 })
    expect(m.acoes.mock.calls[0][0].where).toEqual({ status: "pendente", NOT: { insightKey: { endsWith: ":2026-08-31" } }, aluno: { turma: "Sub-11" } })
    expect(m.pubs.mock.calls[0][0].select.resumo.select).not.toHaveProperty("texto")
  })
  it("identifica publicação acessível e vínculo alterado sem expor contatos", async () => {
    m.pubs.mockResolvedValue([
      { id: 1, responsavelId: 7, publicadoEm: new Date(), responsavel: { nome: "Família A" }, resumo: { mes: "2026-08", aluno: { id: 3, nome: "A", turma: "T", status: "Ativo", responsavelId: 7, responsavelRef: { nome: "Família A", ativo: true } } } },
      { id: 2, responsavelId: 8, publicadoEm: new Date(), responsavel: { nome: "Família Antiga" }, resumo: { mes: "2026-08", aluno: { id: 4, nome: "B", turma: "T", status: "Ativo", responsavelId: 9, responsavelRef: { nome: "Família Nova", ativo: true } } } },
    ])
    const r = await consultarPendenciasOperacionais()
    expect(r.dados?.publicacoes.itens.map((i) => i.vinculoAtual)).toEqual([true, false])
    expect(r.dados?.publicacoes.itens[1].responsavelAtual).toBe("Família Nova")
  })
  it("calcula relatório em janelas civis fechadas e sem causalidade", async () => {
    m.alunoCount.mockResolvedValueOnce(10).mockResolvedValueOnce(6)
    m.freqGroup.mockResolvedValueOnce([{ presenca: "Presente", _count: { _all: 6 } }, { presenca: "Ausente", _count: { _all: 4 } }]).mockResolvedValueOnce([{ presenca: "Presente", _count: { _all: 9 } }, { presenca: "Ausente", _count: { _all: 1 } }, { presenca: "legado", _count: { _all: 2 } }])
    m.acaoGroup.mockResolvedValue([{ status: "pendente", _count: { _all: 2 } }, { status: "concluida", _count: { _all: 3 } }])
    m.planoCount.mockResolvedValueOnce(8).mockResolvedValueOnce(5)
    const r = await consultarRelatorioGerencial({ turma: "Sub-11" })
    expect(r.dados).toMatchObject({ atletasAtivos: 10, avaliacoes: { avaliados: 6, semAvaliacao: 4 }, frequencia: { inicioAnterior: "2026-07-04", fimAnterior: "2026-08-02", inicioAtual: "2026-08-03", fimAtual: "2026-09-01", variacao: 30 }, acoes: { pendentes: 2, concluidas: 3, ignoradas: 0 }, planos: { salvos: 8, comRetorno: 5, semRetorno: 3 } })
    expect(r.dados?.frequencia.atual).toMatchObject({ presentes: 9, validos: 10, desconhecidos: 2, percentualPresenca: 90 })
    expect(m.freqGroup.mock.calls[0][0].where).toEqual({ data: { gte: new Date("2026-07-04"), lt: new Date("2026-08-03") }, aluno: { status: "Ativo", turma: "Sub-11" } })
  })
  it("não calcula variação sem registros válidos nas duas janelas", async () => {
    m.freqGroup.mockResolvedValueOnce([]).mockResolvedValueOnce([{ presenca: "Presente", _count: { _all: 1 } }])
    expect((await consultarRelatorioGerencial()).dados?.frequencia.variacao).toBeNull()
  })
})
