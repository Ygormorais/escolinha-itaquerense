import { describe, it, beforeEach, afterEach, expect, vi } from "vitest"
const m = vi.hoisted(() => ({ session: vi.fn(), alunos: vi.fn(), alunoCount: vi.fn(), acoes: vi.fn(), acaoCount: vi.fn(), grupos: vi.fn(), planos: vi.fn(), planoCount: vi.fn(), publicacoes: vi.fn(), publicacaoCount: vi.fn(), transaction: vi.fn() }))
vi.mock("@/lib/session", () => ({ getSession: m.session }))
vi.mock("@/lib/db", () => ({ db: { aluno: { findMany: m.alunos, count: m.alunoCount }, acaoDesenvolvimento: { findMany: m.acoes, count: m.acaoCount, groupBy: m.grupos }, planoTreino: { findMany: m.planos, count: m.planoCount }, publicacaoResumo: { findMany: m.publicacoes, count: m.publicacaoCount }, $transaction: m.transaction } }))
import { perguntarDesenvolvimento, consultarResultadosAcoes } from "@/app/actions/consultas-desenvolvimento"
import { perguntasDesenvolvimento as q } from "@/lib/perguntas-desenvolvimento"
describe("consultas locais autorizadas", () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-01T01:00:00Z"))
    m.session.mockResolvedValue({ authenticated: true, user: "t", role: "tecnico" })
    m.alunos.mockResolvedValue([]); m.acoes.mockResolvedValue([]); m.alunoCount.mockResolvedValue(0); m.acaoCount.mockResolvedValue(0); m.grupos.mockResolvedValue([]); m.planos.mockResolvedValue([]); m.planoCount.mockResolvedValue(0); m.publicacoes.mockResolvedValue([]); m.publicacaoCount.mockResolvedValue(0)
    m.transaction.mockImplementation((queries) => Promise.all(queries))
  })
  afterEach(() => vi.useRealTimers())
  it.each(["secretaria", "responsavel", undefined])("bloqueia %s antes de consultar", async (role) => {
    m.session.mockResolvedValue({ authenticated: true, user: "x", role })
    await expect(perguntarDesenvolvimento({ pergunta: q.faltas })).rejects.toThrow("Acesso não autorizado")
    await expect(consultarResultadosAcoes()).rejects.toThrow("Acesso não autorizado")
    expect(m.transaction).not.toHaveBeenCalled(); expect(m.grupos).not.toHaveBeenCalled()
  })
  it("exige login", async () => {
    m.session.mockResolvedValue({ authenticated: false })
    await expect(consultarResultadosAcoes()).rejects.toThrow("Não autenticado")
  })
  it.each(["Quem é melhor?", "x".repeat(201)])("recusa pergunta fora do escopo sem ler o banco", async (pergunta) => {
    expect(await perguntarDesenvolvimento({ pergunta })).toHaveProperty("error")
    expect(m.transaction).not.toHaveBeenCalled()
  })
  it("exige falta registrada E nenhuma presença; filtra turma no servidor", async () => {
    await perguntarDesenvolvimento({ pergunta: q.faltas, turma: "Sub-11" })
    const arg = m.alunos.mock.calls[0][0]
    expect(arg.where).toMatchObject({ status: "Ativo", turma: "Sub-11", AND: [{ frequencias: { some: { presenca: "Ausente" } } }, { frequencias: { none: { presenca: "Presente" } } }] })
    expect(arg.where.AND[0].frequencias.some.data).toEqual({ gte: new Date("2026-08-18"), lt: new Date("2026-09-01") })
    expect(arg.select).toEqual({ id: true, nome: true, turma: true })
    expect(arg.take).toBe(50)
    expect(m.alunoCount).toHaveBeenCalledWith({ where: arg.where })
  })
  it("retorna limite e total sem apresentar lista parcial como completa", async () => {
    m.acaoCount.mockResolvedValue(71); m.acoes.mockResolvedValue([{ id: 1, alunoId: 3, titulo: "Acompanhar", aluno: { nome: "Nome", turma: "" } }])
    const r = await perguntarDesenvolvimento({ pergunta: q.pendencias, turma: "" })
    expect(r.resposta?.total).toBe(71); expect(r.resposta?.itens).toHaveLength(1)
    expect(m.acoes.mock.calls[0][0].where).toEqual({ status: "pendente", aluno: { turma: "" } })
  })
  it("ignora avaliações futuras e explicita uso da data de cadastro", async () => {
    const r = await perguntarDesenvolvimento({ pergunta: q.avaliacoes })
    expect(m.alunos.mock.calls[0][0].where.avaliacoes.none.createdAt.lte).toEqual(new Date())
    expect(r.resposta?.criterio).toContain("data de cadastro")
  })
  it("consolida todos os ciclos, sem o limite do histórico", async () => {
    m.grupos.mockResolvedValue([{ status: "pendente", _count: { _all: 140 } }, { status: "concluida", _count: { _all: 60 } }])
    expect(await consultarResultadosAcoes()).toMatchObject({ pendentes: 140, concluidas: 60, ignoradas: 0 })
    expect(m.grupos).toHaveBeenCalledWith({ by: ["status"], _count: { _all: true } })
  })
  it("lista planos sem retorno e não inventa link para uma rota inexistente", async () => {
    m.planoCount.mockResolvedValue(2); m.planos.mockResolvedValue([{ id: 8, turma: "Sub-11", usuario: "tec", createdAt: new Date("2026-08-31T15:00:00Z") }])
    const r = await perguntarDesenvolvimento({ pergunta: q.planosSemRetorno, turma: "Sub-11" })
    expect(r.resposta?.itens[0]).toMatchObject({ href: null, nome: "Sub-11" })
    expect(m.planos.mock.calls[0][0]).toMatchObject({ where: { turma: "Sub-11", retornos: { none: {} } }, take: 50 })
  })
  it("sinaliza publicação sem leitura cujo vínculo mudou", async () => {
    m.publicacaoCount.mockResolvedValue(1); m.publicacoes.mockResolvedValue([{ id: 4, responsavelId: 10, publicadoEm: new Date(), resumo: { mes: "2026-08", aluno: { id: 3, nome: "Atleta", turma: "Sub-11", status: "Ativo", responsavelId: 20, responsavelRef: { ativo: true } } } }])
    const r = await perguntarDesenvolvimento({ pergunta: q.resumosSemLeitura })
    expect(r.resposta?.itens[0]).toMatchObject({ href: "/alunos/3", detalhe: "08/2026 · Vínculo alterado; revisar ou retirar." })
    expect(m.publicacoes.mock.calls[0][0].select).not.toHaveProperty("texto")
  })
  it("define ciclo anterior como qualquer chave fora da semana atual", async () => {
    m.acaoCount.mockResolvedValue(1); m.acoes.mockResolvedValue([{ id: 1, alunoId: 3, titulo: "Ação", insightKey: "3:tipo:2026-08-24", aluno: { nome: "Atleta", turma: "Sub-11" } }])
    const r = await perguntarDesenvolvimento({ pergunta: q.acoesForaCiclo })
    expect(m.acoes.mock.calls[0][0].where).toEqual({ status: "pendente", NOT: { insightKey: { endsWith: ":2026-08-31" } }, aluno: {} })
    expect(r.resposta?.criterio).toContain("futuras ou inválidas")
  })
})
