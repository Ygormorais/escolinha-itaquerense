// Conteúdo institucional REAL da landing. Preencher com material verdadeiro.
// Enquanto vazio, as seções correspondentes não renderizam (zero conteúdo falso).

export interface SobreConteudo {
  titulo: string
  paragrafos: string[]
  /** caminho em /public, ex.: "/landing/sobre.jpg" */
  foto?: string
}
export interface FotoGaleria {
  /** caminho em /public, ex.: "/landing/galeria/treino-1.jpg" */
  src: string
  alt: string
}
export interface Depoimento {
  texto: string
  autor: string
  /** categoria/turma do filho, ex.: "Sub-11" */
  categoria?: string
}

// === PREENCHER ABAIXO COM CONTEÚDO REAL ===
export const sobre: SobreConteudo | null = null
export const galeria: FotoGaleria[] = []
export const depoimentos: Depoimento[] = []
// ==========================================

export function temSobre(): boolean {
  return sobre !== null && sobre.paragrafos.length > 0
}
export function temGaleria(): boolean {
  return galeria.length > 0
}
export function temDepoimentos(): boolean {
  return depoimentos.length > 0
}
