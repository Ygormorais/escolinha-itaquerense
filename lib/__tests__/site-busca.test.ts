import { describe, expect, it } from "vitest"
import { buscarNoSite, termosDaBusca, type NoticiaBusca, type PartidaBusca } from "@/lib/site/busca"

const noticias: NoticiaBusca[] = [
  { id: 1, titulo: "Campeão Mundial Sub-13 na França", subtitulo: "Conquista histórica", categoria: "Conquista", createdAt: new Date("2026-01-10") },
  { id: 2, titulo: "Peneira do Sub-9", subtitulo: null, categoria: "Evento", createdAt: new Date("2026-03-01") },
  { id: 3, titulo: "Convocação Sub-13", subtitulo: "Lista da semana", categoria: "Convocação", createdAt: new Date("2026-04-01") },
]
const partidas: PartidaBusca[] = [
  { id: 10, data: "2026-05-10T10:00:00.000Z", categoria: "Sub-13", competicao: "Paulista A3", casa: "Itaquerense", fora: "São Caetano", href: "/partidas", externo: false },
  { id: 11, data: "2026-06-10T10:00:00.000Z", categoria: "Sub-11", competicao: "Copa Leste", casa: "Juventus", fora: "Itaquerense", href: "/partidas", externo: false },
]

describe("busca do site", () => {
  it("ignora consulta curta ou vazia", () => {
    expect(termosDaBusca("a")).toEqual([])
    expect(termosDaBusca("   ")).toEqual([])
    expect(buscarNoSite(undefined, noticias, partidas).noticias).toEqual([])
  })

  it("acha sem acento e sem caixa", () => {
    const r = buscarNoSite("FRANCA", noticias, partidas)
    expect(r.noticias.map((n) => n.id)).toEqual([1])
    expect(buscarNoSite("sao caetano", noticias, partidas).partidas.map((p) => p.id)).toEqual([10])
  })

  it("exige todas as palavras e ordena do mais recente", () => {
    expect(buscarNoSite("sub-13", noticias, partidas).noticias.map((n) => n.id)).toEqual([3, 1])
    expect(buscarNoSite("sub-13 mundial", noticias, partidas).noticias.map((n) => n.id)).toEqual([1])
    expect(buscarNoSite("itaquerense", noticias, partidas).partidas.map((p) => p.id)).toEqual([11, 10])
  })

  it("procura também no subtítulo, categoria e competição", () => {
    expect(buscarNoSite("lista semana", noticias, partidas).noticias.map((n) => n.id)).toEqual([3])
    expect(buscarNoSite("copa leste", noticias, partidas).partidas.map((p) => p.id)).toEqual([11])
  })

  it("inclui matérias institucionais da landing", () => {
    const materias = [
      { id: "mundial", titulo: "Campeão Mundial Sub-13 na França", resumo: "Em Hyères, o Sub-13...", badge: "Mundial", periodo: "2012" },
      { id: "livro", titulo: "Livro: 100 anos", resumo: "Obra sobre o clube", badge: "Livro" },
    ]
    expect(buscarNoSite("hyeres", [], [], materias).materias.map((m) => m.id)).toEqual(["mundial"])
    expect(buscarNoSite("2012", [], [], materias).materias.map((m) => m.id)).toEqual(["mundial"])
  })
})
