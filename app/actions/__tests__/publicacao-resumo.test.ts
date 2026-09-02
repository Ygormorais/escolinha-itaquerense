import { beforeEach, describe, expect, it, vi } from "vitest"
const m = vi.hoisted(() => ({ session: vi.fn(), familia: vi.fn(), resumo: vi.fn(), disponivel: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), listar: vi.fn(), leitura: vi.fn(), tx: vi.fn(), revalidate: vi.fn() }))
vi.mock("@/lib/session", () => ({ getSession: m.session }))
vi.mock("@/lib/responsavel-session", () => ({ getResponsavelSession: m.familia }))
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }))
vi.mock("@/lib/db", () => ({ db: { resumoFamiliar: { findUnique: m.resumo }, publicacaoResumo: { updateMany: m.atualizar, findMany: m.listar, findFirst: m.leitura }, $transaction: m.tx } }))
import { consultarPublicacaoResumo, publicarResumoFamiliar, retirarPublicacaoResumo, listarResumosPublicados, confirmarLeituraResumo } from "@/app/actions/publicacao-resumo"
const pub = { id: 10, responsavelId: 7, publicadoEm: new Date("2026-08-31T15:00:00Z"), retiradoEm: null, lidoEm: null }
const input = { resumoId: 3, responsavelId: 7, revisado: true }
describe("publicação e leitura de resumos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    m.session.mockResolvedValue({ authenticated: true, user: "tec", role: "tecnico" }); m.familia.mockResolvedValue({ authenticated: true, responsavelId: 7 })
    m.resumo.mockResolvedValue({ id: 3, aluno: { nome: "Atleta", status: "Ativo", responsavelRef: { id: 7, nome: "Família", ativo: true } }, publicacao: null })
    m.disponivel.mockResolvedValue({ id: 3, publicacao: null }); m.criar.mockResolvedValue(pub); m.atualizar.mockResolvedValue({ count: 1 }); m.listar.mockResolvedValue([]); m.leitura.mockResolvedValue({ lidoEm: new Date("2026-08-31T16:00:00Z") })
    m.tx.mockImplementation((cb) => cb({ resumoFamiliar: { findFirst: m.disponivel }, publicacaoResumo: { create: m.criar } }))
  })
  it.each(["secretaria", "responsavel", undefined])("nega operações administrativas ao perfil %s", async (role) => {
    m.session.mockResolvedValue({ authenticated: true, user: "x", role })
    await expect(consultarPublicacaoResumo(3)).rejects.toThrow("Acesso não autorizado")
    await expect(publicarResumoFamiliar(input)).rejects.toThrow("Acesso não autorizado")
    await expect(retirarPublicacaoResumo(10)).rejects.toThrow("Acesso não autorizado")
    expect(m.tx).not.toHaveBeenCalled(); expect(m.resumo).not.toHaveBeenCalled(); expect(m.atualizar).not.toHaveBeenCalled()
  })
  it("não aceita sessão da equipe como sessão da família", async () => {
    m.familia.mockResolvedValue({ authenticated: false })
    expect(await listarResumosPublicados()).toHaveProperty("error")
    expect(await confirmarLeituraResumo(10)).toHaveProperty("error")
    expect(m.listar).not.toHaveBeenCalled(); expect(m.atualizar).not.toHaveBeenCalled()
  })
  it.each([{ revisado: false }, { resumoId: -1 }, { responsavelId: 0 }])("exige confirmação e IDs válidos %j", async (p) => {
    expect(await publicarResumoFamiliar({ ...input, ...p })).toHaveProperty("error"); expect(m.tx).not.toHaveBeenCalled()
  })
  it("confere o destinatário atual e ativo dentro da transação", async () => {
    expect(await publicarResumoFamiliar(input)).toHaveProperty("publicacao.id", 10)
    expect(m.disponivel.mock.calls[0][0].where).toEqual({ id: 3, aluno: { status: "Ativo", responsavelId: 7, responsavelRef: { ativo: true } } })
    expect(m.criar.mock.calls[0][0].data).toEqual({ resumoId: 3, responsavelId: 7, publicadoPor: "tec" })
  })
  it("não publica se o vínculo mudou ou atleta/responsável ficou inativo", async () => {
    m.disponivel.mockResolvedValue(null)
    expect(await publicarResumoFamiliar(input)).toHaveProperty("error")
    expect(m.criar).not.toHaveBeenCalled()
  })
  it("retry devolve publicação original sem nova criação", async () => {
    m.disponivel.mockResolvedValue({ id: 3, publicacao: pub })
    expect(await publicarResumoFamiliar(input)).toHaveProperty("publicacao.publicadoEm", pub.publicadoEm.toISOString())
    expect(m.criar).not.toHaveBeenCalled()
  })
  it.each([{ ...pub, responsavelId: 99 }, { ...pub, retiradoEm: new Date() }])("não transfere destinatário nem republica versão retirada", async (publicacao) => {
    m.disponivel.mockResolvedValue({ id: 3, publicacao })
    expect(await publicarResumoFamiliar(input)).toHaveProperty("error"); expect(m.criar).not.toHaveBeenCalled()
  })
  it("retira sem apagar texto, destinatário ou leitura", async () => {
    await retirarPublicacaoResumo(10)
    expect(m.atualizar.mock.calls[0][0].where).toEqual({ id: 10, retiradoEm: null })
    expect(Object.keys(m.atualizar.mock.calls[0][0].data)).toEqual(["retiradoEm"])
  })
  it("consulta familiar tem duplo escopo de destinatário e vínculo atual", async () => {
    await listarResumosPublicados(30)
    expect(m.listar.mock.calls[0][0].where).toEqual({ responsavelId: 7, retiradoEm: null, responsavel: { ativo: true }, resumo: { aluno: { responsavelId: 7, status: "Ativo" } }, id: { lt: 30 } })
    expect(m.listar.mock.calls[0][0].select.resumo.select).toEqual({ mes: true, texto: true, aluno: { select: { nome: true } } })
    expect(m.atualizar).not.toHaveBeenCalled()
  })
  it("confirma leitura só com autorização no UPDATE e não altera primeira data", async () => {
    await confirmarLeituraResumo(10)
    expect(m.atualizar.mock.calls[0][0].where).toEqual({ id: 10, responsavelId: 7, retiradoEm: null, responsavel: { ativo: true }, resumo: { aluno: { responsavelId: 7, status: "Ativo" } }, lidoEm: null })
    expect(await confirmarLeituraResumo(10)).toHaveProperty("lidoEm", "2026-08-31T16:00:00.000Z")
  })
  it("recusa leitura de publicação inexistente, retirada ou de outra família", async () => {
    m.atualizar.mockResolvedValue({ count: 0 }); m.leitura.mockResolvedValue(null)
    expect(await confirmarLeituraResumo(999)).toHaveProperty("error")
  })
  it("pagina sem expor o item extra", async () => {
    m.listar.mockResolvedValue(Array.from({ length: 11 }, (_, i) => ({ id: 20 - i, publicadoEm: new Date(), lidoEm: null, resumo: { mes: "2026-08", texto: "revisado", aluno: { nome: "Atleta" } } })))
    const r = await listarResumosPublicados()
    expect(r.itens).toHaveLength(10); expect(r.proximaPagina).toBe(11)
  })
  it.each(["Inativo", "Ativo"])("não oferece publicação sem responsável ativo: atleta %s", async (status) => {
    m.resumo.mockResolvedValue({ aluno: { nome: "Atleta", status, responsavelRef: { id: 7, nome: "Família", ativo: false } }, publicacao: null })
    expect(await consultarPublicacaoResumo(3)).toHaveProperty("dados.responsavel", null)
  })
})
