import { describe, it, expect } from "vitest"
import {
  agruparPorFaseGrupo,
  linhasClassifValidas,
  preferCampPorCategoria,
  preferirFaseGeral,
  sortCategoriaSub,
  sortFaseClassificacao,
  type LinhaClassifView,
} from "@/lib/classificacao-view"

const L = (partial: Partial<LinhaClassifView> & Pick<LinhaClassifView, "id" | "fase" | "timeNome">): LinhaClassifView => ({
  posicao: 1,
  pontos: 0,
  jogos: 0,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  golsPro: 0,
  golsContra: 0,
  saldo: 0,
  ehNosso: false,
  grupo: null,
  ...partial,
})

describe("linhasClassifValidas", () => {
  it("remove fases JOGO N", () => {
    const rows = [
      L({ id: 1, fase: "Classificação", timeNome: "A" }),
      L({ id: 2, fase: "JOGO 12", timeNome: "B" }),
    ]
    expect(linhasClassifValidas(rows).map((r) => r.id)).toEqual([1])
  })
})

describe("preferirFaseGeral", () => {
  it("fica so com Classificacao quando existe", () => {
    const rows = [
      L({ id: 1, fase: "GRUPO A", timeNome: "A" }),
      L({ id: 2, fase: "Classificação", timeNome: "B" }),
      L({ id: 3, fase: "Classificação", timeNome: "C" }),
    ]
    expect(preferirFaseGeral(rows).map((r) => r.id)).toEqual([2, 3])
  })
  it("mantem grupos se nao houver fase geral", () => {
    const rows = [L({ id: 1, fase: "GRUPO A", timeNome: "A" })]
    expect(preferirFaseGeral(rows)).toHaveLength(1)
  })
})

describe("preferCampPorCategoria", () => {
  it("escolhe um campeonato por Sub (mais recente)", () => {
    const camps = [
      {
        id: 1,
        nome: "FPFS 2025 · Sub-10",
        fpfsSyncEm: new Date("2025-12-01"),
        dataInicio: new Date("2025-01-01"),
        classificacaoFpfs: [L({ id: 1, fase: "Classificação", timeNome: "X" })],
      },
      {
        id: 2,
        nome: "FPFS 2026 · Sub-10",
        fpfsSyncEm: new Date("2026-06-01"),
        dataInicio: new Date("2026-01-01"),
        classificacaoFpfs: [L({ id: 2, fase: "Classificação", timeNome: "Y" })],
      },
      {
        id: 3,
        nome: "FPFS 2026 · Sub-7",
        fpfsSyncEm: null,
        dataInicio: new Date("2026-02-01"),
        classificacaoFpfs: [L({ id: 3, fase: "GRUPO A", timeNome: "Z" })],
      },
    ]
    const best = preferCampPorCategoria(camps)
    expect(best.map((c) => c.id).sort()).toEqual([2, 3])
  })
})

describe("agruparPorFaseGrupo", () => {
  it("agrupa fase e grupo e ordena fases", () => {
    const rows = [
      L({ id: 1, fase: "CHAVE OURO", grupo: null, timeNome: "A" }),
      L({ id: 2, fase: "Classificação", grupo: null, timeNome: "B" }),
      L({ id: 3, fase: "1ª FASE", grupo: "GRUPO A", timeNome: "C" }),
    ]
    const g = agruparPorFaseGrupo(rows)
    expect(g[0].fase).toMatch(/classifica/i)
    expect(g.some((x) => x.fase.includes("FASE") && x.grupos.some((gg) => gg.grupo === "GRUPO A"))).toBe(
      true,
    )
  })
  it("soFaseGeral enxuga para Classificacao", () => {
    const rows = [
      L({ id: 1, fase: "GRUPO A", timeNome: "A" }),
      L({ id: 2, fase: "Classificação", timeNome: "B" }),
    ]
    const g = agruparPorFaseGrupo(rows, { soFaseGeral: true })
    expect(g).toHaveLength(1)
    expect(g[0].fase).toMatch(/classifica/i)
  })
})

describe("sort helpers", () => {
  it("sortCategoriaSub por numero Sub", () => {
    expect(["Sub-12", "Sub-7", "Sub-9"].sort(sortCategoriaSub)).toEqual([
      "Sub-7",
      "Sub-9",
      "Sub-12",
    ])
  })
  it("sortFaseClassificacao prioriza Classificacao", () => {
    expect(["CHAVE OURO", "Classificação", "GRUPO A"].sort(sortFaseClassificacao)[0]).toBe(
      "Classificação",
    )
  })
})
