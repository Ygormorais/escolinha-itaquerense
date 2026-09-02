import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { montarResumoFamiliar, recorteResumoFamiliar } from "@/lib/resumo-familiar"
const mocks = vi.hoisted(() => ({ session: vi.fn(), aluno: vi.fn(), salvar: vi.fn(), listar: vi.fn(), existente: vi.fn(), log: vi.fn() }))
vi.mock("@/lib/session", () => ({ getSession: mocks.session }))
vi.mock("@/lib/db", () => ({ db: { aluno: { findUnique: mocks.aluno }, resumoFamiliar: { upsert: mocks.salvar, findMany: mocks.listar, findUnique: mocks.existente } } }))
vi.mock("@/app/actions/log", () => ({ registrarLog: mocks.log }))
import { listarResumosFamiliares, prepararResumoFamiliar, salvarResumoFamiliar } from "@/app/actions/resumo-familiar"

describe("prepararResumoFamiliar", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T15:00:00Z"))
    mocks.session.mockResolvedValue({ authenticated: true, user: "tecnico", role: "tecnico" })
    mocks.aluno.mockResolvedValue({ nome: "Atleta", frequencias: [{ presenca: "Presente" }], _count: { avaliacoes: 1 } })
  })
  afterEach(() => vi.useRealTimers())
  it.each(["secretaria", "responsavel", undefined])("bloqueia perfil %s antes de consultar os registros", async (role) => {
    mocks.session.mockResolvedValue({ authenticated: true, user: "outro", role })
    await expect(prepararResumoFamiliar({ alunoId: 12, mes: "2026-08" })).rejects.toThrow("Acesso não autorizado")
    expect(mocks.aluno).not.toHaveBeenCalled()
  })
  it("bloqueia sessão expirada", async () => {
    mocks.session.mockResolvedValue({ authenticated: false })
    await expect(prepararResumoFamiliar({ alunoId: 12, mes: "2026-08" })).rejects.toThrow("Não autenticado")
    expect(mocks.aluno).not.toHaveBeenCalled()
  })
  it.each([{ alunoId: 0, mes: "2026-08" }, { alunoId: 12, mes: "2026-13" }, { alunoId: 12, mes: "2026-09" }])("valida entrada antes da consulta: %j", async (input) => {
    expect(await prepararResumoFamiliar(input)).toHaveProperty("error")
    expect(mocks.aluno).not.toHaveBeenCalled()
  })
  it.each(["admin", "tecnico"])("gera para %s com consulta mínima, por atleta e período", async (role) => {
    mocks.session.mockResolvedValue({ authenticated: true, user: role, role })
    const result = await prepararResumoFamiliar({ alunoId: 12, mes: "2026-08" })
    expect(result.resumo?.texto).toContain("família de Atleta")
    expect(mocks.aluno).toHaveBeenCalledWith({
      where: { id: 12 },
      select: {
        nome: true,
        frequencias: { where: { data: { gte: new Date("2026-08-01T00:00:00Z"), lt: new Date("2026-08-16T00:00:00Z") } }, select: { presenca: true } },
        _count: { select: { avaliacoes: { where: { createdAt: { gte: new Date("2026-08-01T03:00:00Z"), lt: new Date("2026-09-01T03:00:00Z"), lte: new Date() } } } } },
      },
    })
  })
  it("trata atleta removido sem retornar dados de outro", async () => {
    mocks.aluno.mockResolvedValue(null)
    expect(await prepararResumoFamiliar({ alunoId: 12, mes: "2026-08" })).toEqual({ error: "Atleta não encontrado." })
  })
})

describe("versões revisadas do resumo familiar", () => {
  const texto = "Resumo revisado pela comissão técnica, com os registros do mês."
  const textoBase = montarResumoFamiliar({ nome: "Atleta", mes: "2026-08", periodo: recorteResumoFamiliar("2026-08", new Date("2026-08-15T15:00:00Z"))!.label, parcial: true, presencas: ["Presente"], avaliacoesRegistradas: 1 }).texto
  const input = { alunoId: 12, mes: "2026-08", texto, textoBase, revisado: true }
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-15T15:00:00Z"))
    mocks.session.mockResolvedValue({ authenticated: true, user: "tecnico", role: "tecnico" })
    mocks.aluno.mockResolvedValue({ nome: "Atleta", frequencias: [{ presenca: "Presente" }], _count: { avaliacoes: 1 } })
    mocks.existente.mockResolvedValue(null)
    mocks.salvar.mockResolvedValue({ id: 1, mes: input.mes, texto, usuario: "tecnico", createdAt: new Date() })
    mocks.listar.mockResolvedValue([])
  })
  afterEach(() => vi.useRealTimers())

  it.each(["secretaria", "responsavel", undefined])("não permite leitura ou gravação pelo perfil %s", async (role) => {
    mocks.session.mockResolvedValue({ authenticated: true, user: "outro", role })
    await expect(salvarResumoFamiliar(input)).rejects.toThrow("Acesso não autorizado")
    await expect(listarResumosFamiliares({ alunoId: 12 })).rejects.toThrow("Acesso não autorizado")
    expect(mocks.aluno).not.toHaveBeenCalled()
    expect(mocks.listar).not.toHaveBeenCalled()
    expect(mocks.salvar).not.toHaveBeenCalled()
    expect(mocks.existente).not.toHaveBeenCalled()
  })
  it("exige sessão também na consulta de versões antigas", async () => {
    mocks.session.mockResolvedValue({ authenticated: false })
    await expect(listarResumosFamiliares({ alunoId: 12 })).rejects.toThrow("Não autenticado")
    await expect(salvarResumoFamiliar(input)).rejects.toThrow("Não autenticado")
    expect(mocks.listar).not.toHaveBeenCalled()
    expect(mocks.salvar).not.toHaveBeenCalled()
  })
  it.each([
    { revisado: false }, { texto: "   " }, { texto: "x".repeat(4001) },
    { textoBase: "" }, { textoBase: "x".repeat(4001) },
    { mes: "2026-09" }, { mes: "2026-13" }, { mes: "2025-07" }, { alunoId: -1 },
  ])("recusa revisão inválida antes de gravar: %j", async (changes) => {
    expect(await salvarResumoFamiliar({ ...input, ...changes })).toHaveProperty("error")
    expect(mocks.salvar).not.toHaveBeenCalled()
  })
  it("recusa um cliente antigo sem a base obrigatória", async () => {
    // @ts-expect-error Simula um payload antigo sem o campo obrigatório.
    const result = await salvarResumoFamiliar({ alunoId: 12, mes: input.mes, texto, revisado: true })
    expect(result).toHaveProperty("error")
    expect(mocks.existente).not.toHaveBeenCalled()
    expect(mocks.salvar).not.toHaveBeenCalled()
  })
  it("não salva se o atleta tiver sido removido", async () => {
    mocks.aluno.mockResolvedValue(null)
    expect(await salvarResumoFamiliar(input)).toEqual({ error: "Atleta não encontrado." })
    expect(mocks.salvar).not.toHaveBeenCalled()
  })
  it("recusa a base se a frequência mudou depois da preparação", async () => {
    mocks.aluno.mockResolvedValue({ nome: "Atleta", frequencias: [{ presenca: "Presente" }], _count: { avaliacoes: 1 } })
    const preparado = await prepararResumoFamiliar({ alunoId: 12, mes: input.mes })
    mocks.aluno.mockResolvedValue({ nome: "Atleta", frequencias: [{ presenca: "Ausente" }], _count: { avaliacoes: 1 } })
    const result = await salvarResumoFamiliar({ ...input, textoBase: preparado.resumo!.texto })
    expect(result.error).toContain("registros do mês mudaram")
    expect(mocks.salvar).not.toHaveBeenCalled()
  })
  it.each([
    { nome: "Outro nome", frequencias: [{ presenca: "Presente" }], _count: { avaliacoes: 1 } },
    { nome: "Atleta", frequencias: [{ presenca: "Presente" }], _count: { avaliacoes: 2 } },
  ])("recusa base quando nome ou avaliações mudam: %j", async (atual) => {
    mocks.aluno.mockResolvedValue(atual)
    expect(await salvarResumoFamiliar(input)).toHaveProperty("desatualizado", true)
    expect(mocks.salvar).not.toHaveBeenCalled()
    expect(mocks.log).not.toHaveBeenCalled()
  })
  it("recusa base adulterada sem gravar", async () => {
    expect(await salvarResumoFamiliar({ ...input, textoBase: `${textoBase} Alterado.` })).toHaveProperty("desatualizado", true)
    expect(mocks.salvar).not.toHaveBeenCalled()
  })
  it("aceita nova revisão após atualizar a base", async () => {
    mocks.aluno.mockResolvedValue({ nome: "Atleta", frequencias: [{ presenca: "Ausente" }], _count: { avaliacoes: 2 } })
    const atualizado = await prepararResumoFamiliar({ alunoId: 12, mes: input.mes })
    expect(await salvarResumoFamiliar({ ...input, textoBase: atualizado.resumo!.texto })).toHaveProperty("salvo")
  })
  it("recupera retry confirmado sem regravar, mesmo se o período saiu da janela", async () => {
    const antigo = { id: 1, mes: input.mes, texto, usuario: "tecnico", createdAt: new Date("2026-08-15T15:00:00Z") }
    mocks.existente.mockResolvedValue(antigo)
    vi.setSystemTime(new Date("2027-09-15T15:00:00Z"))
    expect(await salvarResumoFamiliar(input)).toEqual({ salvo: { ...antigo, createdAt: antigo.createdAt.toISOString() } })
    expect(mocks.aluno).not.toHaveBeenCalled()
    expect(mocks.salvar).not.toHaveBeenCalled()
    expect(mocks.log).not.toHaveBeenCalled()
  })
  it.each(["admin", "tecnico"])("salva versão imutável e atribui o autor da sessão %s", async (role) => {
    mocks.session.mockResolvedValue({ authenticated: true, user: "autor_real", role })
    const result = await salvarResumoFamiliar(input)
    expect(result.salvo?.createdAt).toBe(new Date().toISOString())
    expect(mocks.salvar).toHaveBeenCalledWith(expect.objectContaining({
      update: {}, create: expect.objectContaining({ alunoId: 12, mes: "2026-08", texto, usuario: "autor_real" }),
    }))
    expect(mocks.log).toHaveBeenCalledWith("resumo_familiar_salvo", "Resumo familiar revisado — Atleta", { alunoId: 12, resumoId: 1, mes: "2026-08" })
  })
  it("usa a mesma chave em retries e outra chave para uma nova revisão ou atleta", async () => {
    await salvarResumoFamiliar(input)
    await salvarResumoFamiliar({ ...input, texto: ` ${texto} ` })
    await salvarResumoFamiliar({ ...input, texto: `${texto} Nova revisão.` })
    await salvarResumoFamiliar({ ...input, alunoId: 13 })
    const keys = mocks.salvar.mock.calls.map(([arg]) => arg.where.chave)
    expect(keys[0]).toBe(keys[1])
    expect(keys[0]).not.toBe(keys[2])
    expect(keys[0]).not.toBe(keys[3])
  })
  it("pagina por atleta sem limitar o histórico à janela de geração", async () => {
    mocks.listar.mockResolvedValue(Array.from({ length: 21 }, (_, index) => ({
      id: 100 - index, mes: "2020-01", texto, usuario: "tecnico", createdAt: new Date("2020-02-01"),
    })))
    const result = await listarResumosFamiliares({ alunoId: 12, antesDe: 101 })
    expect(result.itens).toHaveLength(20)
    expect(result.proximaPagina).toBe(81)
    expect(mocks.listar).toHaveBeenCalledWith(expect.objectContaining({ where: { alunoId: 12, id: { lt: 101 } }, orderBy: { id: "desc" }, take: 21 }))
  })
  it("retorna histórico vazio sem indicar mais páginas", async () => {
    expect(await listarResumosFamiliares({ alunoId: 12 })).toEqual({ itens: [], proximaPagina: null })
  })
  it("valida cursor e atleta antes de consultar", async () => {
    expect(await listarResumosFamiliares({ alunoId: 12, antesDe: -1 })).toHaveProperty("error")
    expect(await listarResumosFamiliares({ alunoId: 0 })).toHaveProperty("error")
    expect(mocks.listar).not.toHaveBeenCalled()
  })
})
