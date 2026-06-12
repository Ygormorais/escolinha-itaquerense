export type AvaliacaoEvolucao = {
  periodo: string
  notaTecnica: number | null
  notaFisica: number | null
  notaComportamento: number | null
  frequencia: number | null
}

export type PontoEvolucao = {
  periodo: string
  tecnica: number | null
  fisica: number | null
  comportamento: number | null
  /** frequência % reescalada para 0-10 */
  frequencia: number | null
}

export function montarSeriesEvolucao(avaliacoes: AvaliacaoEvolucao[]): PontoEvolucao[] {
  return [...avaliacoes]
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map((a) => ({
      periodo: a.periodo,
      tecnica: a.notaTecnica,
      fisica: a.notaFisica,
      comportamento: a.notaComportamento,
      frequencia: a.frequencia == null ? null : Math.round(a.frequencia) / 10,
    }))
}
