import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/fpfs/client", () => ({
  urlJogos: (id: number) => `j/${id}`,
  urlClassificacao: (id: number) => `c/${id}`,
  fetchHtml: vi.fn(),
}))
vi.mock("@/lib/db", () => {
  const db = {
    campeonato: { findUnique: vi.fn(), update: vi.fn() },
    partida: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    classificacaoFpfs: { deleteMany: vi.fn(), createMany: vi.fn() },
  }
  return { db }
})
vi.mock("@/lib/fpfs/parser", () => ({ parseJogos: vi.fn(), parseClassificacao: vi.fn() }))

import { syncCampeonato } from "@/lib/fpfs/sync"
import { db } from "@/lib/db"
import { fetchHtml } from "@/lib/fpfs/client"
import { parseJogos, parseClassificacao } from "@/lib/fpfs/parser"

const m = db as unknown as {
  campeonato: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  partida: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  classificacaoFpfs: { deleteMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.campeonato.findUnique.mockResolvedValue({ id: 1, fpfsEventoId: 920, fpfsTimeNome: "E.C. Itaquerense" })
  m.campeonato.update.mockResolvedValue({})
  m.partida.create.mockResolvedValue({ id: 10 })
  m.partida.update.mockResolvedValue({ id: 10 })
  m.classificacaoFpfs.deleteMany.mockResolvedValue({})
  m.classificacaoFpfs.createMany.mockResolvedValue({})
  ;(fetchHtml as ReturnType<typeof vi.fn>).mockResolvedValue("<html></html>")
  ;(parseJogos as ReturnType<typeof vi.fn>).mockReturnValue([
    { fpfsJogoId: "555", rodada: 1, data: "2026-04-11", hora: "17:00", ginasio: "G1",
      mandante: "E.C. Itaquerense", visitante: "Vila Real", golsMandante: 3, golsVisitante: 1, sumulaUrl: "s/555" },
  ])
  ;(parseClassificacao as ReturnType<typeof vi.fn>).mockReturnValue([
    { fase: "1ª Fase", grupo: "Grupo A", posicao: 1, timeNome: "E.C. Itaquerense",
      pontos: 9, jogos: 3, vitorias: 3, empates: 0, derrotas: 0, golsPro: 10, golsContra: 2, saldo: 8 },
    { fase: "1ª Fase", grupo: "Grupo A", posicao: 2, timeNome: "Vila Real",
      pontos: 6, jogos: 3, vitorias: 2, empates: 0, derrotas: 1, golsPro: 8, golsContra: 5, saldo: 3 },
  ])
})

describe("syncCampeonato", () => {
  it("cria partida quando fpfsJogoId nao existe", async () => {
    m.partida.findFirst.mockResolvedValue(null)
    const resumo = await syncCampeonato(1)
    expect(m.partida.create).toHaveBeenCalledTimes(1)
    expect(resumo.jogosNovos).toBe(1)
    expect(resumo.jogosAtualizados).toBe(0)
  })
  it("atualiza partida existente em vez de duplicar (idempotente)", async () => {
    m.partida.findFirst.mockResolvedValue({ id: 10 })
    const resumo = await syncCampeonato(1)
    expect(m.partida.create).not.toHaveBeenCalled()
    expect(m.partida.update).toHaveBeenCalledTimes(1)
    expect(resumo.jogosAtualizados).toBe(1)
  })
  it("recria a classificacao e marca ehNosso pelo fpfsTimeNome", async () => {
    m.partida.findFirst.mockResolvedValue(null)
    await syncCampeonato(1)
    expect(m.classificacaoFpfs.deleteMany).toHaveBeenCalledWith({ where: { campeonatoId: 1 } })
    const rows = m.classificacaoFpfs.createMany.mock.calls[0][0].data
    expect(rows).toHaveLength(2)
    expect(rows.find((r: any) => r.timeNome === "E.C. Itaquerense").ehNosso).toBe(true)
    expect(rows.find((r: any) => r.timeNome === "Vila Real").ehNosso).toBe(false)
  })
  it("atualiza fpfsSyncEm do campeonato", async () => {
    m.partida.findFirst.mockResolvedValue(null)
    await syncCampeonato(1)
    expect(m.campeonato.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }))
    expect(m.campeonato.update.mock.calls[0][0].data.fpfsSyncEm).toBeInstanceOf(Date)
  })
  it("lanca erro se o campeonato nao tem fpfsEventoId", async () => {
    m.campeonato.findUnique.mockResolvedValue({ id: 1, fpfsEventoId: null })
    await expect(syncCampeonato(1)).rejects.toThrow()
  })

  it("usa chave estavel para jogo sem sumula (nao duplica entre syncs)", async () => {
    ;(parseJogos as ReturnType<typeof vi.fn>).mockReturnValue([
      { fpfsJogoId: null, rodada: 1, data: "2026-04-11", hora: "10:00", ginasio: "G2",
        mandante: "Time X", visitante: "Time Y", golsMandante: null, golsVisitante: null, sumulaUrl: null },
    ])
    // 1a execucao: nao existe -> cria com chave sintetica nao nula
    m.partida.findFirst.mockResolvedValue(null)
    await syncCampeonato(1)
    const criado = m.partida.create.mock.calls[0][0].data
    expect(criado.fpfsJogoId).toBe("m:2026-04-11|Time X|Time Y")
    // a busca de idempotencia usa a mesma chave
    expect(m.partida.findFirst).toHaveBeenCalledWith({
      where: { campeonatoId: 1, fpfsJogoId: "m:2026-04-11|Time X|Time Y" },
    })

    // 2a execucao: agora existe -> atualiza, nao duplica
    vi.clearAllMocks()
    m.campeonato.findUnique.mockResolvedValue({ id: 1, fpfsEventoId: 920, fpfsTimeNome: "E.C. Itaquerense" })
    m.campeonato.update.mockResolvedValue({})
    m.classificacaoFpfs.deleteMany.mockResolvedValue({})
    m.classificacaoFpfs.createMany.mockResolvedValue({})
    ;(parseClassificacao as ReturnType<typeof vi.fn>).mockReturnValue([])
    ;(parseJogos as ReturnType<typeof vi.fn>).mockReturnValue([
      { fpfsJogoId: null, rodada: 1, data: "2026-04-11", hora: "10:00", ginasio: "G2",
        mandante: "Time X", visitante: "Time Y", golsMandante: null, golsVisitante: null, sumulaUrl: null },
    ])
    m.partida.findFirst.mockResolvedValue({ id: 77 })
    await syncCampeonato(1)
    expect(m.partida.create).not.toHaveBeenCalled()
    expect(m.partida.update).toHaveBeenCalledTimes(1)
  })

  it("grava a data ao meio-dia local (sem shift de fuso)", async () => {
    m.partida.findFirst.mockResolvedValue(null)
    await syncCampeonato(1)
    const data: Date = m.partida.create.mock.calls[0][0].data.data
    expect(data).toBeInstanceOf(Date)
    expect(data.getFullYear()).toBe(2026)
    expect(data.getMonth()).toBe(3) // abril (0-based)
    expect(data.getDate()).toBe(11)
  })
})
