import { beforeEach, describe, expect, it, vi } from "vitest"
import { prepararPautaSemanal } from "@/lib/pauta-semanal"

const mocks = vi.hoisted(() => ({ session: vi.fn(), painel: vi.fn(), find: vi.fn(), salvar: vi.fn(), listar: vi.fn(), turmas: vi.fn(), log: vi.fn() }))
vi.mock("@/lib/session", () => ({ getSession: mocks.session }))
vi.mock("@/lib/desenvolvimento-data", () => ({ carregarPainelDesenvolvimento: mocks.painel }))
vi.mock("@/lib/db", () => ({ db: { pautaSemanal: { findUnique: mocks.find, upsert: mocks.salvar, findMany: mocks.listar, groupBy: mocks.turmas } } }))
vi.mock("@/app/actions/log", () => ({ registrarLog: mocks.log }))
import { consultarPautaSemanal, listarPautasSemanais, salvarPautaSemanal } from "@/app/actions/pauta-semanal"

const panel = { cicloInicio: "2026-08-31", insights: [], acoes: {}, oportunidades: [{ alunoId: 1, nome: "Atleta", turma: "Sub-13" }] }
const textoBase = prepararPautaSemanal({ ...panel, atletas: panel.oportunidades }, "Sub-13").texto
const input = { turma: "Sub-13", cicloInicio: "2026-08-31", texto: "Pauta revisada pela comissão para o acompanhamento semanal.", textoBase, revisado: true }
const row = { id: 1, turma: input.turma, cicloInicio: input.cicloInicio, texto: input.texto, usuario: "tecnico", createdAt: new Date("2026-08-31T13:00:00Z") }

describe("histórico interno de pautas", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({ authenticated: true, user: "tecnico", role: "tecnico" })
    mocks.painel.mockResolvedValue(panel)
    mocks.find.mockResolvedValue(null)
    mocks.salvar.mockResolvedValue(row)
    mocks.listar.mockResolvedValue([])
    mocks.turmas.mockResolvedValue([])
  })

  it.each(["secretaria", "responsavel", undefined])("bloqueia perfil %s em todas as operações antes de consultar dados", async (role) => {
    mocks.session.mockResolvedValue({ authenticated: true, user: "outro", role })
    await expect(salvarPautaSemanal(input)).rejects.toThrow("Acesso não autorizado")
    await expect(listarPautasSemanais()).rejects.toThrow("Acesso não autorizado")
    await expect(consultarPautaSemanal(1)).rejects.toThrow("Acesso não autorizado")
    expect(mocks.find).not.toHaveBeenCalled()
    expect(mocks.listar).not.toHaveBeenCalled()
    expect(mocks.turmas).not.toHaveBeenCalled()
    expect(mocks.salvar).not.toHaveBeenCalled()
    expect(mocks.painel).not.toHaveBeenCalled()
  })

  it("bloqueia sessão expirada", async () => {
    mocks.session.mockResolvedValue({ authenticated: false })
    await expect(salvarPautaSemanal(input)).rejects.toThrow("Não autenticado")
    await expect(listarPautasSemanais()).rejects.toThrow("Não autenticado")
    await expect(consultarPautaSemanal(1)).rejects.toThrow("Não autenticado")
    expect(mocks.find).not.toHaveBeenCalled()
    expect(mocks.turmas).not.toHaveBeenCalled()
  })

  it.each([{ revisado: false }, { texto: "curto" }, { texto: "x".repeat(100001) }, { textoBase: "" }, { turma: "x".repeat(151) }, { cicloInicio: "inválido" }])("valida revisão e limites antes do banco: %j", async (change) => {
    expect(await salvarPautaSemanal({ ...input, ...change })).toHaveProperty("error")
    expect(mocks.find).not.toHaveBeenCalled()
    expect(mocks.salvar).not.toHaveBeenCalled()
  })

  it.each(["admin", "tecnico"])("salva para %s com autor da sessão e sem sobrescrever versões", async (role) => {
    mocks.session.mockResolvedValue({ authenticated: true, user: "autor_real", role })
    const result = await salvarPautaSemanal({ ...input, ...{ usuario: "autor_forjado" } })
    expect(result.salvo?.createdAt).toBe(row.createdAt.toISOString())
    expect(mocks.salvar).toHaveBeenCalledWith(expect.objectContaining({ update: {}, create: expect.objectContaining({ usuario: "autor_real", texto: input.texto, turma: input.turma, cicloInicio: input.cicloInicio }) }))
    expect(mocks.log).toHaveBeenCalledWith("pauta_semanal_salva", "Pauta semanal revisada — Sub-13", { pautaId: 1, turma: "Sub-13", cicloInicio: "2026-08-31" })
  })

  it("normaliza quebras e gera chave idempotente por autor, ciclo, turma e conteúdo", async () => {
    await salvarPautaSemanal(input)
    await salvarPautaSemanal({ ...input, texto: ` ${input.texto} `, textoBase: textoBase.replaceAll("\n", "\r\n") })
    await salvarPautaSemanal({ ...input, texto: `${input.texto} Segunda versão.` })
    mocks.session.mockResolvedValue({ authenticated: true, user: "outro_tecnico", role: "tecnico" })
    await salvarPautaSemanal(input)
    const keys = mocks.salvar.mock.calls.map(([arg]) => arg.where.chave)
    expect(keys[0]).toBe(keys[1])
    expect(new Set([keys[0], keys[2], keys[3]]).size).toBe(3)
  })

  it("recupera um retry já salvo sem duplicar nem regravar, mesmo após mudança do painel", async () => {
    mocks.find.mockResolvedValue(row)
    const result = await salvarPautaSemanal(input)
    expect(result.salvo?.id).toBe(1)
    expect(mocks.painel).not.toHaveBeenCalled()
    expect(mocks.salvar).not.toHaveBeenCalled()
    expect(mocks.log).not.toHaveBeenCalled()
  })

  it("rejeita mudança de ciclo sem gravar", async () => {
    mocks.painel.mockResolvedValue({ ...panel, cicloInicio: "2026-09-07" })
    expect((await salvarPautaSemanal(input)).error).toContain("O ciclo mudou")
    expect(mocks.salvar).not.toHaveBeenCalled()
  })

  it("rejeita turma removida sem inventar um retrato", async () => {
    mocks.painel.mockResolvedValue({ ...panel, oportunidades: [] })
    expect((await salvarPautaSemanal(input)).error).toContain("turma não está disponível")
    expect(mocks.salvar).not.toHaveBeenCalled()
  })

  it("compara a base com os registros atuais no servidor, não apenas o estado do navegador", async () => {
    mocks.painel.mockResolvedValue({ ...panel, oportunidades: [...panel.oportunidades, { alunoId: 2, nome: "Novo atleta", turma: "Sub-13" }] })
    expect((await salvarPautaSemanal(input)).error).toContain("registros da turma mudaram")
    expect(mocks.salvar).not.toHaveBeenCalled()
  })

  it("não permite base adulterada", async () => {
    expect((await salvarPautaSemanal({ ...input, textoBase: textoBase.replace("Atletas ativos na turma: 1", "Atletas ativos na turma: 100") })).error).toContain("registros da turma mudaram")
    expect(mocks.salvar).not.toHaveBeenCalled()
  })

  it("pagina por ID, filtra turma e não carrega texto completo na listagem", async () => {
    mocks.listar.mockResolvedValue(Array.from({ length: 11 }, (_, i) => ({ ...row, id: 30 - i })))
    const result = await listarPautasSemanais({ turma: "Sub-13", antesDe: 31 })
    expect(result.itens).toHaveLength(10)
    expect(result.proximaPagina).toBe(21)
    expect(mocks.listar).toHaveBeenCalledWith({ where: { turma: "Sub-13", id: { lt: 31 } }, select: { id: true, turma: true, cicloInicio: true, usuario: true, createdAt: true }, orderBy: { id: "desc" }, take: 11 })
  })

  it("mantém consulta de turmas antigas independente de atletas ativos", async () => {
    mocks.listar.mockResolvedValue([{ ...row, turma: "Turma antiga" }])
    const result = await listarPautasSemanais()
    expect(result.itens?.[0].turma).toBe("Turma antiga")
    expect(result.proximaPagina).toBeNull()
    expect(mocks.painel).not.toHaveBeenCalled()
  })

  it("consulta opções no histórico inteiro, sem texto nem vínculo com elenco ativo", async () => {
    mocks.turmas.mockResolvedValue([{ turma: "" }, { turma: "Turma antiga" }])
    const result = await listarPautasSemanais({ turma: "Turma antiga", cicloInicio: "2026-08-31" })
    expect(result.turmas).toEqual(["", "Turma antiga"])
    expect(mocks.turmas).toHaveBeenCalledWith({ by: ["turma"], orderBy: { turma: "asc" } })
    expect(mocks.painel).not.toHaveBeenCalled()
  })

  it("combina turma, ciclo e cursor na paginação sem recarregar opções", async () => {
    await listarPautasSemanais({ turma: "Sub-13", cicloInicio: "2026-08-31", antesDe: 20 })
    expect(mocks.listar).toHaveBeenCalledWith(expect.objectContaining({ where: { turma: "Sub-13", cicloInicio: "2026-08-31", id: { lt: 20 } } }))
    expect(mocks.turmas).not.toHaveBeenCalled()
  })

  it("distingue todas as turmas de registros sem turma", async () => {
    await listarPautasSemanais({ turma: "" })
    expect(mocks.listar).toHaveBeenLastCalledWith(expect.objectContaining({ where: { turma: "" } }))
    await listarPautasSemanais()
    expect(mocks.listar).toHaveBeenLastCalledWith(expect.objectContaining({ where: {} }))
  })

  it("aceita consulta apenas pelo ciclo", async () => {
    await listarPautasSemanais({ cicloInicio: "2026-08-31" })
    expect(mocks.listar).toHaveBeenCalledWith(expect.objectContaining({ where: { cicloInicio: "2026-08-31" } }))
  })

  it.each(["", "2026-09-01", "2026-02-30", "2026-13-01", "31/08/2026", "2026-08-31T00:00:00Z"])("recusa ciclo inválido %s antes de qualquer consulta", async (cicloInicio) => {
    expect(await listarPautasSemanais({ cicloInicio })).toHaveProperty("error")
    expect(mocks.listar).not.toHaveBeenCalled()
    expect(mocks.turmas).not.toHaveBeenCalled()
  })

  it("valida paginação e identificador", async () => {
    expect(await listarPautasSemanais({ antesDe: -1 })).toHaveProperty("error")
    expect(await consultarPautaSemanal(0)).toHaveProperty("error")
    expect(mocks.listar).not.toHaveBeenCalled()
    expect(mocks.find).not.toHaveBeenCalled()
  })

  it("consulta somente a versão pedida ou retorna não encontrada", async () => {
    expect((await consultarPautaSemanal(99)).error).toContain("não encontrada")
    mocks.find.mockResolvedValue(row)
    const result = await consultarPautaSemanal(1)
    expect(result.pauta).toEqual({ ...row, createdAt: row.createdAt.toISOString() })
    expect(mocks.find).toHaveBeenLastCalledWith({ where: { id: 1 }, select: { id: true, turma: true, cicloInicio: true, texto: true, usuario: true, createdAt: true } })
  })
})
