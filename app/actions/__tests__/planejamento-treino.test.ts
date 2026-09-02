import { describe, it, beforeEach, expect, vi } from "vitest"
const m = vi.hoisted(() => ({ session: vi.fn(), salvar: vi.fn(), listar: vi.fn(), plano: vi.fn(), retornoSalvar: vi.fn(), retornos: vi.fn(), planoCount: vi.fn(), retornoCount: vi.fn(), transaction: vi.fn() }))
vi.mock("@/lib/session", () => ({ getSession: m.session }))
vi.mock("@/lib/db", () => ({ db: { planoTreino: { upsert: m.salvar, findMany: m.listar, findUnique: m.plano, count: m.planoCount }, retornoPlanoTreino: { upsert: m.retornoSalvar, findMany: m.retornos, count: m.retornoCount }, $transaction: m.transaction } }))
import { consultarValidacaoCatalogo, salvarPlanoTreino, listarPlanosTreino, listarRetornosPlanoTreino, registrarRetornoPlanoTreino } from "@/app/actions/planejamento-treino"
import type { PreferenciasTreino } from "@/lib/planejamento-treino"
const preferencias: PreferenciasTreino = { turma: "Sub-11", faixa: "9–11", duracao: 45, objetivo: "passes", bolas: true, cones: false }
const input = { preferencias, revisado: true, texto: "Plano revisado para participação do grupo com ajustes de espaço, pausas, materiais e atividades." }
describe("planos de treino", () => {
  beforeEach(() => { vi.clearAllMocks(); m.session.mockResolvedValue({ authenticated: true, user: "tec", role: "tecnico" }); m.salvar.mockResolvedValue({ id: 1, turma: "Sub-11", texto: input.texto, usuario: "tec", createdAt: new Date() }); m.listar.mockResolvedValue([]); m.plano.mockResolvedValue({ id: 1, createdAt: new Date("2026-08-30T12:00:00Z") }); m.retornoSalvar.mockResolvedValue({ id: 2, aplicadoEm: "2026-08-31", resultado: "adaptado", observacao: "Reduzimos o espaço.", usuario: "tec", createdAt: new Date("2026-08-31T18:00:00Z") }); m.retornos.mockResolvedValue([]); m.planoCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0); m.retornoCount.mockResolvedValue(0); m.transaction.mockImplementation((queries) => Promise.all(queries)) })
  it.each(["secretaria", "responsavel", undefined])("recusa %s", async (role) => {
    m.session.mockResolvedValue({ authenticated: true, user: "x", role })
    await expect(salvarPlanoTreino(input)).rejects.toThrow("Acesso não autorizado")
    await expect(listarPlanosTreino({ turma: "Sub-11" })).rejects.toThrow("Acesso não autorizado")
    expect(m.salvar).not.toHaveBeenCalled()
  })
  it.each([{ revisado: false }, { texto: "curto" }, { texto: "x".repeat(8001) }, { preferencias: { ...preferencias, bolas: false } }])("valida no servidor %j", async (p) => {
    expect(await salvarPlanoTreino({ ...input, ...p })).toHaveProperty("error"); expect(m.salvar).not.toHaveBeenCalled()
  })
  it("salva versão imutável e chave idempotente calculada no servidor", async () => {
    await salvarPlanoTreino(input); await salvarPlanoTreino({ ...input, texto: ` ${input.texto} ` })
    expect(m.salvar.mock.calls[0][0].where).toEqual(m.salvar.mock.calls[1][0].where)
    expect(m.salvar.mock.calls[0][0].update).toEqual({})
    expect(m.salvar.mock.calls[0][0].create.usuario).toBe("tec")
    await salvarPlanoTreino({ ...input, texto: `${input.texto} Mais detalhes.` })
    expect(m.salvar.mock.calls[2][0].where).not.toEqual(m.salvar.mock.calls[0][0].where)
  })
  it("pagina por turma sem incluir o item extra", async () => {
    m.listar.mockResolvedValue(Array.from({ length: 11 }, (_, i) => ({ id: 20 - i, createdAt: new Date() })))
    const r = await listarPlanosTreino({ turma: "Sub-11", antesDe: 25 })
    expect(r.itens).toHaveLength(10); expect(r.proximaPagina).toBe(11)
    expect(m.listar.mock.calls[0][0].where).toEqual({ turma: "Sub-11", id: { lt: 25 } })
  })

  it.each(["secretaria", "responsavel", undefined])("recusa retorno do perfil %s antes do banco", async (role) => {
    m.session.mockResolvedValue({ authenticated: true, user: "x", role })
    await expect(registrarRetornoPlanoTreino({ planoId: 1, aplicadoEm: "2026-08-31", resultado: "adaptado", observacao: "Ajuste", confirmado: true })).rejects.toThrow("Acesso não autorizado")
    await expect(listarRetornosPlanoTreino({ planoId: 1 })).rejects.toThrow("Acesso não autorizado")
    expect(m.plano).not.toHaveBeenCalled(); expect(m.retornos).not.toHaveBeenCalled()
  })
  it.each([
    { planoId: 0 }, { aplicadoEm: "31/08/2026" }, { resultado: "aprovado" }, { observacao: "x" }, { observacao: "x".repeat(1001) }, { confirmado: false },
  ])("valida retorno no servidor %j", async (override) => {
    const r = await registrarRetornoPlanoTreino({ planoId: 1, aplicadoEm: "2026-08-31", resultado: "adaptado", observacao: "Ajuste", confirmado: true, ...override })
    expect(r).toHaveProperty("error"); expect(m.plano).not.toHaveBeenCalled(); expect(m.retornoSalvar).not.toHaveBeenCalled()
  })
  it.each(["2026-08-29", "2026-09-01"])("recusa aplicação anterior ao plano ou futura: %s", async (aplicadoEm) => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-08-31T15:00:00Z"))
    try { expect(await registrarRetornoPlanoTreino({ planoId: 1, aplicadoEm, resultado: "adaptado", observacao: "Ajuste", confirmado: true })).toHaveProperty("error") } finally { vi.useRealTimers() }
    expect(m.retornoSalvar).not.toHaveBeenCalled()
  })
  it("salva retornos imutáveis e torna retry idempotente", async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-08-31T15:00:00Z"))
    try {
      const retorno = { planoId: 1, aplicadoEm: "2026-08-31", resultado: "adaptado", observacao: " Reduzimos o espaço. ", confirmado: true }
      await registrarRetornoPlanoTreino(retorno); await registrarRetornoPlanoTreino(retorno)
      expect(m.retornoSalvar.mock.calls[0][0].where).toEqual(m.retornoSalvar.mock.calls[1][0].where)
      expect(m.retornoSalvar.mock.calls[0][0].update).toEqual({})
      expect(m.retornoSalvar.mock.calls[0][0].create).toMatchObject({ planoId: 1, observacao: "Reduzimos o espaço.", usuario: "tec" })
    } finally { vi.useRealTimers() }
  })
  it("lista retornos paginados sem o item extra", async () => {
    m.retornos.mockResolvedValue(Array.from({ length: 11 }, (_, i) => ({ id: 20 - i, createdAt: new Date() })))
    const r = await listarRetornosPlanoTreino({ planoId: 1, antesDe: 30 })
    expect(r.itens).toHaveLength(10); expect(r.proximaPagina).toBe(11)
    expect(m.retornos.mock.calls[0][0].where).toEqual({ planoId: 1, id: { lt: 30 } })
  })
  it.each(["secretaria", "responsavel", undefined])("recusa consolidação para %s", async (role) => {
    m.session.mockResolvedValue({ authenticated: true, user: "x", role })
    await expect(consultarValidacaoCatalogo()).rejects.toThrow("Acesso não autorizado")
    expect(m.transaction).not.toHaveBeenCalled()
  })
  it("consolida todos os registros sem confundir registros com planos", async () => {
    m.planoCount.mockReset().mockResolvedValueOnce(12).mockResolvedValueOnce(7)
    m.retornoCount.mockReset().mockResolvedValueOnce(14).mockResolvedValueOnce(4).mockResolvedValueOnce(6).mockResolvedValueOnce(3)
    const r = await consultarValidacaoCatalogo()
    expect(r.dados).toMatchObject({ totalPlanos: 12, comRetorno: 7, semRetorno: 5, totalRetornos: 14, resultados: { adequado: 4, adaptado: 6, naoUtilizado: 3, naoReconhecido: 1 } })
    expect(m.listar.mock.calls[0][0]).toMatchObject({ where: { retornos: { none: {} } }, take: 50 })
  })
  it.each([undefined, "", "Sub-11"])("mantém escopo exato da turma %j", async (turma) => {
    await consultarValidacaoCatalogo({ turma })
    const where = turma === undefined ? {} : { turma }
    expect(m.planoCount.mock.calls[0][0]).toEqual({ where })
    expect(m.planoCount.mock.calls[1][0]).toEqual({ where: { ...where, retornos: { some: {} } } })
    expect(m.retornoCount.mock.calls[0][0]).toEqual({ where: { plano: where } })
    expect(m.retornoCount.mock.calls[1][0]).toEqual({ where: { plano: where, resultado: "adequado" } })
    expect(m.listar.mock.calls[0][0].where).toEqual({ ...where, retornos: { none: {} } })
  })
  it("limita a lista e mantém o total real de pendências", async () => {
    m.planoCount.mockReset().mockResolvedValueOnce(80).mockResolvedValueOnce(20)
    m.listar.mockResolvedValue(Array.from({ length: 50 }, (_, id) => ({ id: id + 1, createdAt: new Date() })))
    const r = await consultarValidacaoCatalogo()
    expect(r.dados?.semRetorno).toBe(60); expect(r.dados?.pendentes).toHaveLength(50); expect(r.dados?.limitePendentes).toBe(50)
  })
})
