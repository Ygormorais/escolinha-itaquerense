/**
 * Categorias da escolinha e do futsal federado: faixa etária e em que modalidade cada
 * uma existe. Fonte única para a página de horários e a seção "+ TURMAS" da landing.
 */

export const FAIXA_ETARIA: Record<string, string> = {
  "Sub-7": "5 – 7 anos",
  "Sub-9": "7 – 9 anos",
  "Sub-11": "9 – 11 anos",
  "Sub-13": "11 – 13 anos",
  "Sub-15": "13 – 15 anos",
  "Sub-17": "15 – 17 anos",
  "Sub-18": "17 – 18 anos",
}

export const CATEGORIAS_ESCOLINHA = ["Sub-7", "Sub-9", "Sub-11", "Sub-13"]
export const CATEGORIAS_FEDERADO = ["Sub-11", "Sub-13", "Sub-15", "Sub-17", "Sub-18"]

export type CategoriaResumo = { categoria: string; idade: string; escolinha: boolean; federado: boolean }

/** Todas as categorias, da mais nova para a mais velha, com as modalidades de cada uma. */
export function resumoCategorias(): CategoriaResumo[] {
  return Object.keys(FAIXA_ETARIA).map((categoria) => ({
    categoria,
    idade: FAIXA_ETARIA[categoria],
    escolinha: CATEGORIAS_ESCOLINHA.includes(categoria),
    federado: CATEGORIAS_FEDERADO.includes(categoria),
  }))
}
