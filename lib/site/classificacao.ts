import { db } from "@/lib/db"
import { preferirFaseGeral } from "@/lib/classificacao-view"
import { categoriaCurta } from "@/lib/landing/times"

export type ClassifLinha = {
  id: number
  posicao: number
  timeNome: string
  pontos: number
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  golsPro: number
  golsContra: number
  saldo: number
  ehNosso: boolean
}

export type ClassifCamp = {
  id: number
  nome: string
  categoria: string
  fpfsSyncEm: string | null
  linhas: ClassifLinha[]
}

/** Uma tabela por categoria: a do campeonato sincronizado mais recentemente. */
export function melhorPorCategoria(camps: ClassifCamp[]): Map<string, ClassifCamp> {
  const best = new Map<string, ClassifCamp>()
  for (const c of camps) {
    if (c.linhas.length === 0) continue
    const prev = best.get(c.categoria)
    const tPrev = prev?.fpfsSyncEm ?? ""
    const tCur = c.fpfsSyncEm ?? ""
    if (!prev || tCur > tPrev || (tCur === tPrev && c.id > prev.id)) best.set(c.categoria, c)
  }
  return best
}

/** Classificações FPFS dos campeonatos ativos da temporada atual e da anterior. */
export async function getClassificacoesPorCategoria(agora: Date = new Date()): Promise<Map<string, ClassifCamp>> {
  const inicioTemporada = new Date(agora.getFullYear() - 1, 0, 1)
  const campeonatos = await db.campeonato.findMany({
    where: {
      status: { not: "encerrado" },
      classificacaoFpfs: { some: {} },
      OR: [
        { partidas: { some: { data: { gte: inicioTemporada }, local: { in: ["Casa", "Fora"] } } } },
        { dataInicio: { gte: inicioTemporada } },
      ],
    },
    include: { classificacaoFpfs: { orderBy: [{ fase: "asc" }, { posicao: "asc" }] } },
    orderBy: { dataInicio: "desc" },
  })

  return melhorPorCategoria(
    campeonatos.map((c) => ({
      id: c.id,
      nome: c.nome,
      categoria: categoriaCurta(c.nome),
      fpfsSyncEm: c.fpfsSyncEm ? c.fpfsSyncEm.toISOString() : null,
      linhas: preferirFaseGeral(c.classificacaoFpfs).map((l) => ({
        id: l.id,
        posicao: l.posicao,
        timeNome: l.timeNome,
        pontos: l.pontos,
        jogos: l.jogos,
        vitorias: l.vitorias,
        empates: l.empates,
        derrotas: l.derrotas,
        golsPro: l.golsPro,
        golsContra: l.golsContra,
        saldo: l.saldo,
        ehNosso: l.ehNosso,
      })),
    })),
  )
}
