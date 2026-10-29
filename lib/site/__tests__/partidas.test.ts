import { describe, expect, it } from "vitest"
import {
  filtrarPartidas,
  formatarDataHora,
  hrefPartidas,
  janelaPaginas,
  lerFiltros,
  nomeCompeticao,
  paginar,
  type PartidaLinha,
} from "../partidas"

function linha(id: number, data: string, extra: Partial<PartidaLinha> = {}): PartidaLinha {
  return {
    id,
    data,
    categoria: "Sub-13",
    competicao: "Federação Paulista de Futsal",
    local: "Casa",
    nosCasa: true,
    casa: "Itaquerense",
    fora: "Rival",
    placar: null,
    resultado: "Proximo",
    escudosAdversario: [],
    href: "/partidas",
    externo: false,
    temSumula: false,
    ...extra,
  }
}

describe("lerFiltros", () => {
  it("aceita categoria, situação e página válidas", () => {
    expect(lerFiltros({ categoria: "Sub-9", situacao: "realizados", pagina: "3" })).toEqual({
      categoria: "Sub-9",
      situacao: "realizados",
      pagina: 3,
    })
  })

  it("descarta valores inválidos e volta ao padrão", () => {
    expect(lerFiltros({ categoria: "<script>", situacao: "x", pagina: "-2" })).toEqual({
      categoria: null,
      situacao: "todos",
      pagina: 1,
    })
    expect(lerFiltros({ categoria: ["Sub-11", "Sub-13"] }).categoria).toBe("Sub-11")
  })
})

describe("hrefPartidas", () => {
  const base = { categoria: "Sub-13", situacao: "realizados" as const, pagina: 4 }

  it("trocar filtro volta para a primeira página", () => {
    expect(hrefPartidas(base, { categoria: "Sub-9" })).toBe("/partidas?categoria=Sub-9&situacao=realizados")
  })

  it("mudar só a página mantém os filtros", () => {
    expect(hrefPartidas(base, { pagina: 5 })).toBe("/partidas?categoria=Sub-13&situacao=realizados&pagina=5")
  })

  it("sem filtros gera a URL limpa", () => {
    expect(hrefPartidas(base, { categoria: null, situacao: "todos" })).toBe("/partidas")
  })
})

describe("filtrarPartidas", () => {
  const agora = new Date("2026-10-28T12:00:00")
  const linhas = [
    linha(1, "2026-11-04T21:30:00"),
    linha(2, "2026-10-30T20:00:00"),
    linha(3, "2026-10-10T10:00:00", { placar: [4, 1], resultado: "Vitoria" }),
    linha(4, "2026-09-20T10:00:00", { placar: [0, 2], resultado: "Derrota", categoria: "Sub-9" }),
    linha(5, "2026-10-01T10:00:00", { resultado: "SemPlacar" }),
  ]

  it("próximos: só futuros sem placar, do mais perto para o mais longe", () => {
    expect(filtrarPartidas(linhas, { categoria: null, situacao: "proximos", pagina: 1 }, agora).map((p) => p.id)).toEqual([2, 1])
  })

  it("realizados: só com placar, do mais recente para o mais antigo", () => {
    expect(filtrarPartidas(linhas, { categoria: null, situacao: "realizados", pagina: 1 }, agora).map((p) => p.id)).toEqual([3, 4])
  })

  it("todos com categoria: inclui jogo passado sem placar e ordena por data decrescente", () => {
    expect(filtrarPartidas(linhas, { categoria: "Sub-13", situacao: "todos", pagina: 1 }, agora).map((p) => p.id)).toEqual([1, 2, 3, 5])
  })
})

describe("paginação", () => {
  it("corta a página e limita ao intervalo válido", () => {
    const r = paginar([1, 2, 3, 4, 5], 9, 2)
    expect(r).toEqual({ itens: [5], pagina: 3, totalPaginas: 3 })
  })

  it("mostra salto quando há muitas páginas", () => {
    expect(janelaPaginas(5, 12)).toEqual([1, null, 4, 5, 6, null, 12])
    expect(janelaPaginas(1, 4)).toEqual([1, 2, 3, 4])
  })
})

describe("formatação", () => {
  it("mostra horário só quando a partida tem hora definida", () => {
    expect(formatarDataHora("2026-11-04T21:30:00")).toEqual({ dia: "04/11/2026", hora: "21h30" })
    expect(formatarDataHora("2026-11-04T00:00:00")).toEqual({ dia: "04/11/2026", hora: null })
    // 12:00 é o valor que o sync FPFS grava quando a federação não informa horário
    expect(formatarDataHora("2026-11-04T12:00:00")).toEqual({ dia: "04/11/2026", hora: null })
    expect(formatarDataHora("2026-11-04T12:30:00")).toEqual({ dia: "04/11/2026", hora: "12h30" })
  })

  it("traduz campeonatos FPFS e limpa o sufixo do evento", () => {
    expect(nomeCompeticao("FPFS Categoria Sub-18 · ev.851", 851)).toBe("Federação Paulista de Futsal")
    expect(nomeCompeticao("Copa Zona Leste · ev.12", null)).toBe("Copa Zona Leste")
  })
})
