import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn(), update: vi.fn(), list: vi.fn(), log: vi.fn(), revalidate: vi.fn() }))
vi.mock("@/lib/session", () => ({ getSession: mocks.session }))
vi.mock("@/lib/db", () => ({ db: { acaoDesenvolvimento: { findUnique: mocks.find, updateMany: mocks.update, findMany: mocks.list } } }))
vi.mock("@/app/actions/log", () => ({ registrarLog: mocks.log }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }))
import { encerrarPendenciaDesenvolvimento, listarPendenciasDesenvolvimento } from "@/app/actions/pendencias-desenvolvimento"

const input = { id: 10, versao: "2026-01-01T12:00:00.000Z", status: "concluida" as const, observacao: "Família contatada e retorno combinado" }
describe("pendências registradas de desenvolvimento", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.session.mockResolvedValue({ authenticated: true, user: "tecnico", role: "tecnico" })
    mocks.find.mockResolvedValue({ alunoId: 12, titulo: "Ação antiga", insightKey: "12:baixa_frequencia:2026-01-01", aluno: { nome: "Atleta" } })
    mocks.update.mockResolvedValue({ count: 1 })
    mocks.list.mockResolvedValue([])
  })
  it.each(["secretaria", "responsavel", undefined])("bloqueia leitura e escrita pelo perfil %s", async (role) => {
    mocks.session.mockResolvedValue({ authenticated: true, user: "outro", role })
    await expect(encerrarPendenciaDesenvolvimento(input)).rejects.toThrow("Acesso não autorizado")
    await expect(listarPendenciasDesenvolvimento({})).rejects.toThrow("Acesso não autorizado")
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.find).not.toHaveBeenCalled()
    expect(mocks.list).not.toHaveBeenCalled()
  })
  it("recusa sessão expirada antes de consultar", async () => {
    mocks.session.mockResolvedValue({ authenticated: false })
    await expect(encerrarPendenciaDesenvolvimento(input)).rejects.toThrow("Não autenticado")
    await expect(listarPendenciasDesenvolvimento({})).rejects.toThrow("Não autenticado")
    expect(mocks.find).not.toHaveBeenCalled()
  })
  it.each([{ observacao: "  " }, { observacao: "x".repeat(501) }, { versao: "inválida" }, { id: -1 }])("valida encerramento: %j", async (change) => {
    expect(await encerrarPendenciaDesenvolvimento({ ...input, ...change })).toHaveProperty("error")
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it("encerra no ciclo original sem depender dos indicadores atuais", async () => {
    expect(await encerrarPendenciaDesenvolvimento(input)).toEqual({ success: true })
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 10, status: "pendente", updatedAt: new Date(input.versao) },
      data: { status: "concluida", observacao: input.observacao, usuario: "tecnico", concluidaEm: expect.any(Date), updatedAt: expect.any(Date) },
    })
    expect(mocks.log).toHaveBeenCalledWith("acao_desenvolvimento_atualizada", "Ação antiga — Atleta", expect.objectContaining({ alunoId: 12, insightKey: "12:baixa_frequencia:2026-01-01" }))
    expect(mocks.revalidate).toHaveBeenCalledWith("/desenvolvimento")
    expect(mocks.revalidate).toHaveBeenCalledWith("/alunos/12")
  })
  it("permite ignorar com justificativa sem marcar data de conclusão", async () => {
    mocks.session.mockResolvedValue({ authenticated: true, user: "admin", role: "admin" })
    await encerrarPendenciaDesenvolvimento({ ...input, status: "ignorada", observacao: "  Ação já não se aplica  " })
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "ignorada", observacao: "Ação já não se aplica", usuario: "admin", concluidaEm: null }) }))
  })
  it("não sobrescreve alterações concorrentes nem gera log de sucesso", async () => {
    mocks.update.mockResolvedValue({ count: 0 })
    expect(await encerrarPendenciaDesenvolvimento(input)).toMatchObject({ conflito: true })
    expect(mocks.log).not.toHaveBeenCalled()
    expect(mocks.revalidate).not.toHaveBeenCalled()
  })
  it("não tenta recriar ações removidas", async () => {
    mocks.find.mockResolvedValue(null)
    expect(await encerrarPendenciaDesenvolvimento(input)).toHaveProperty("error")
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it("lista pendências antigas por atleta com paginação e sem planos inválidos", async () => {
    mocks.list.mockResolvedValue(Array.from({ length: 21 }, (_, index) => ({
      id: index + 11, alunoId: 12, aluno: { nome: "Atleta", turma: "Sub-13" }, titulo: "Antiga",
      observacao: null, usuario: null, planoSemanal: index === 0 ? "inválido" : '["Plano aprovado"]', insightKey: "12:baixa_frequencia:2020-01-06", updatedAt: new Date(input.versao),
    })))
    const result = await listarPendenciasDesenvolvimento({ alunoId: 12, depoisDe: 10 })
    expect(result.itens).toHaveLength(20)
    expect(result.itens?.[0]).toMatchObject({ cicloInicio: "2020-01-06", status: "pendente", planoSemanal: null })
    expect(result.itens?.[1].planoSemanal).toEqual(["Plano aprovado"])
    expect(result.proximaPagina).toBe(30)
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ where: { alunoId: 12, status: "pendente", id: { gt: 10 } }, orderBy: { id: "asc" }, take: 21 }))
  })
  it("recusa cursor e aluno inválidos sem consultar", async () => {
    expect(await listarPendenciasDesenvolvimento({ alunoId: 0 })).toHaveProperty("error")
    expect(await listarPendenciasDesenvolvimento({ depoisDe: -1 })).toHaveProperty("error")
    expect(mocks.list).not.toHaveBeenCalled()
  })
  it("retorna página vazia sem próximo cursor", async () => {
    expect(await listarPendenciasDesenvolvimento({})).toEqual({ itens: [], proximaPagina: null })
  })
})
