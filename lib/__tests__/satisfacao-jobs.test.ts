import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    pesquisaSatisfacao: { findMany: vi.fn(), updateMany: vi.fn() },
    responsavel: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/push", () => ({ sendPushToResponsavel: vi.fn() }))

import { runLembretePesquisaSatisfacao } from "../satisfacao-jobs"
import { db } from "@/lib/db"
import { sendPushToResponsavel } from "@/lib/push"

const mockDb = db as unknown as {
  pesquisaSatisfacao: { findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> }
  responsavel: { findMany: ReturnType<typeof vi.fn> }
}
const push = sendPushToResponsavel as ReturnType<typeof vi.fn>

const campanha = (fim: string) => ({
  id: 7,
  titulo: "Pesquisa de dezembro",
  inicio: new Date("2026-12-01T00:00:00.000Z"),
  fim: new Date(`${fim}T00:00:00.000Z`),
  encerradaEm: null,
  lembrete: true,
  lembreteEnviadoEm: null,
})
const AGORA = new Date("2026-12-18T15:00:00.000Z")

beforeEach(() => {
  vi.clearAllMocks()
  push.mockResolvedValue(undefined)
  mockDb.pesquisaSatisfacao.updateMany.mockResolvedValue({ count: 1 })
})

describe("runLembretePesquisaSatisfacao", () => {
  it("manda push a quem ainda não respondeu e marca a campanha", async () => {
    mockDb.pesquisaSatisfacao.findMany.mockResolvedValue([campanha("2026-12-20")])
    mockDb.responsavel.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
    const res = await runLembretePesquisaSatisfacao(AGORA)
    expect(res).toEqual({ campanhas: 1, enviados: 2 })
    expect(push).toHaveBeenCalledTimes(2)
    expect(push.mock.calls[0]).toEqual([1, "comunicado", expect.objectContaining({ url: "/responsavel/pesquisa" })])
    expect(mockDb.pesquisaSatisfacao.updateMany).toHaveBeenCalledWith({ where: { id: 7, lembreteEnviadoEm: null }, data: { lembreteEnviadoEm: AGORA } })
    const filtro = mockDb.responsavel.findMany.mock.calls[0][0].where
    expect(filtro.respostasSatisfacao).toEqual({ none: { pesquisaId: 7 } })
  })

  it("não manda fora da janela dos últimos 3 dias", async () => {
    mockDb.pesquisaSatisfacao.findMany.mockResolvedValue([campanha("2026-12-30")])
    expect(await runLembretePesquisaSatisfacao(AGORA)).toEqual({ campanhas: 0, enviados: 0 })
    expect(push).not.toHaveBeenCalled()
  })

  it("outra execução que já marcou a campanha não reenvia", async () => {
    mockDb.pesquisaSatisfacao.findMany.mockResolvedValue([campanha("2026-12-20")])
    mockDb.pesquisaSatisfacao.updateMany.mockResolvedValue({ count: 0 })
    expect(await runLembretePesquisaSatisfacao(AGORA)).toEqual({ campanhas: 1, enviados: 0 })
    expect(push).not.toHaveBeenCalled()
  })

  it("devolve erro sem lançar quando o banco falha", async () => {
    mockDb.pesquisaSatisfacao.findMany.mockRejectedValue(new Error("db down"))
    expect(await runLembretePesquisaSatisfacao(AGORA)).toEqual({ error: "db down" })
  })
})
