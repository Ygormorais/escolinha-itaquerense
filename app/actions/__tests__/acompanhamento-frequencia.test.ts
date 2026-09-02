import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ session: vi.fn(), acao: vi.fn(), frequencias: vi.fn() }))
vi.mock("@/lib/session", () => ({ getSession: mocks.session }))
vi.mock("@/lib/db", () => ({ db: { acaoDesenvolvimento: { findUnique: mocks.acao }, frequencia: { findMany: mocks.frequencias } } }))
import { consultarAcompanhamentoFrequencia } from "@/app/actions/acompanhamento-frequencia"

describe("consulta de frequência após conclusão", () => {
  beforeEach(() => {
    vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-08-15T15:00:00Z"))
    mocks.session.mockResolvedValue({ authenticated: true, user: "tecnico", role: "tecnico" })
    mocks.acao.mockResolvedValue({ alunoId: 12, status: "concluida", concluidaEm: new Date("2026-07-01T15:00:00Z") })
    mocks.frequencias.mockResolvedValue([])
  })
  afterEach(() => vi.useRealTimers())
  it.each(["secretaria", "responsavel", undefined])("bloqueia perfil %s antes da consulta", async (role) => {
    mocks.session.mockResolvedValue({ authenticated: true, user: "outro", role })
    await expect(consultarAcompanhamentoFrequencia(1)).rejects.toThrow("Acesso não autorizado")
    expect(mocks.acao).not.toHaveBeenCalled()
    expect(mocks.frequencias).not.toHaveBeenCalled()
  })
  it("exige autenticação", async () => {
    mocks.session.mockResolvedValue({ authenticated: false })
    await expect(consultarAcompanhamentoFrequencia(1)).rejects.toThrow("Não autenticado")
    expect(mocks.acao).not.toHaveBeenCalled()
  })
  it("recusa ID inválido", async () => {
    expect(await consultarAcompanhamentoFrequencia(-1)).toHaveProperty("error")
    expect(mocks.acao).not.toHaveBeenCalled()
  })
  it.each([null, { alunoId: 12, status: "pendente" }, { alunoId: 12, status: "ignorada" }, { alunoId: 12, status: "concluida", concluidaEm: null }, { alunoId: 12, status: "concluida", concluidaEm: new Date("2027-01-01") }])("não inventa data para ação indisponível: %j", async (acao) => {
    mocks.acao.mockResolvedValue(acao)
    expect(await consultarAcompanhamentoFrequencia(1)).toHaveProperty("error")
    expect(mocks.frequencias).not.toHaveBeenCalled()
  })
  it.each(["admin", "tecnico"])("consulta para %s somente o atleta da ação e as duas janelas", async (role) => {
    mocks.session.mockResolvedValue({ authenticated: true, user: role, role })
    const result = await consultarAcompanhamentoFrequencia(10)
    expect(result.acompanhamento?.situacao).toBe("amostra_insuficiente")
    expect(mocks.frequencias).toHaveBeenCalledWith({
      where: { alunoId: 12, OR: [
        { data: { gte: new Date("2026-06-01"), lt: new Date("2026-07-01") } },
        { data: { gte: new Date("2026-07-02"), lt: new Date("2026-08-01") } },
      ] }, select: { data: true, presenca: true },
    })
  })
})
