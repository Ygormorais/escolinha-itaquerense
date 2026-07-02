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

// === CONTEÚDO REAL ===
export const sobre: SobreConteudo | null = {
  titulo: "Mais de 100 anos formando campeões",
  paragrafos: [
    "Fundado em 1922, o E.C. Itaquerense é uma das instituições esportivas mais tradicionais da Zona Leste de São Paulo. Com as cores alvirrubras carregadas de história, o clube já formou mais de 6.000 atletas ao longo de sua trajetória.",
    "Nossa escolinha abrange categorias do Sub-7 ao Sub-18, unindo formação esportiva de qualidade com desenvolvimento humano. Cada criança é tratada com atenção individual em um ambiente seguro, acolhedor e que respeita o ritmo de cada fase.",
    "Em 2012, nossa equipe Sub-13 conquistou o título mundial em torneio realizado na França — um feito que enche de orgulho toda a comunidade itaquerense e comprova o nível técnico da nossa formação de base.",
  ],
}

export const galeria: FotoGaleria[] = []

export const depoimentos: Depoimento[] = []
// =====================

export function temSobre(): boolean {
  return sobre !== null && sobre.paragrafos.length > 0
}
export function temGaleria(): boolean {
  return galeria.length > 0
}
export function temDepoimentos(): boolean {
  return depoimentos.length > 0
}
