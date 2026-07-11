/**
 * Helpers de visualização de classificação FPFS (portal + site público).
 * Filtros de fase e escolha de campeonato/fase para UI enxuta.
 */

import { isFaseTabelaClassificacao } from "@/lib/fpfs/parser"
import { categoriaCurta } from "@/lib/landing/times"

export type LinhaClassifView = {
  id: number
  fase: string
  grupo?: string | null
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

export function sortCategoriaSub(a: string, b: string): number {
  const na = Number(a.match(/Sub-(\d+)/i)?.[1])
  const nb = Number(b.match(/Sub-(\d+)/i)?.[1])
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
  return a.localeCompare(b, "pt-BR")
}

/** Preferir fase “Classificação” / Geral; depois grupos; evita poluir com chaves extras. */
export function sortFaseClassificacao(a: string, b: string): number {
  const score = (f: string) => {
    if (/^classifica/i.test(f)) return 0
    if (/geral/i.test(f)) return 1
    if (/fase/i.test(f)) return 2
    if (/grupo/i.test(f)) return 3
    if (/chave/i.test(f)) return 4
    return 5
  }
  const d = score(a) - score(b)
  return d !== 0 ? d : a.localeCompare(b, "pt-BR")
}

export function linhasClassifValidas<T extends { fase: string }>(linhas: T[]): T[] {
  return linhas.filter((l) => isFaseTabelaClassificacao(l.fase))
}

/**
 * Preferir linhas da fase geral “Classificação” quando existirem
 * (HTML bem menor e tabela legível).
 */
export function preferirFaseGeral<T extends { fase: string }>(linhas: T[]): T[] {
  const uteis = linhasClassifValidas(linhas)
  const geral = uteis.filter((l) => /^classifica/i.test(l.fase.trim()))
  return geral.length > 0 ? geral : uteis
}

/** Uma tabela por categoria: campeonato mais recente com linhas válidas. */
export function preferCampPorCategoria<
  T extends {
    id: number
    nome: string
    fpfsSyncEm: Date | string | null
    dataInicio?: Date | string | null
    classificacaoFpfs: { fase: string }[]
  },
>(camps: T[]): T[] {
  const best = new Map<string, T>()
  for (const c of camps) {
    if (linhasClassifValidas(c.classificacaoFpfs).length === 0) continue
    const cat = categoriaCurta(c.nome)
    const prev = best.get(cat)
    if (!prev) {
      best.set(cat, c)
      continue
    }
    const tPrev = toMs(prev.fpfsSyncEm) || toMs(prev.dataInicio)
    const tCur = toMs(c.fpfsSyncEm) || toMs(c.dataInicio)
    if (tCur > tPrev || (tCur === tPrev && c.id > prev.id)) {
      best.set(cat, c)
    }
  }
  return [...best.values()]
}

function toMs(v: Date | string | null | undefined): number {
  if (v == null) return 0
  if (v instanceof Date) return v.getTime()
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? t : 0
}

/**
 * Agrupa linhas válidas: fase → grupo → linhas (ordenado).
 */
export function agruparPorFaseGrupo<T extends LinhaClassifView>(
  linhas: T[],
  opts?: { soFaseGeral?: boolean },
): { fase: string; grupos: { grupo: string | null; linhas: T[] }[] }[] {
  const base = opts?.soFaseGeral ? preferirFaseGeral(linhas) : linhasClassifValidas(linhas)
  const porFase = new Map<string, Map<string | null, T[]>>()
  for (const l of base) {
    if (!porFase.has(l.fase)) porFase.set(l.fase, new Map())
    const gMap = porFase.get(l.fase)!
    const g = l.grupo ?? null
    if (!gMap.has(g)) gMap.set(g, [])
    gMap.get(g)!.push(l)
  }
  return [...porFase.keys()]
    .sort(sortFaseClassificacao)
    .map((fase) => {
      const gMap = porFase.get(fase)!
      const grupos = [...gMap.keys()]
        .sort((a, b) => (a ?? "").localeCompare(b ?? "", "pt-BR"))
        .map((grupo) => ({ grupo, linhas: gMap.get(grupo)! }))
      return { fase, grupos }
    })
}
