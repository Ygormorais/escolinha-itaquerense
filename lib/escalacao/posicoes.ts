export const POSICOES_QUADRA = ["GOLEIRO", "FIXO", "ALA_ESQ", "ALA_DIR", "PIVO"] as const
export const POSICOES = [...POSICOES_QUADRA, "BANCO"] as const

export type Posicao = (typeof POSICOES)[number]

export const LABEL_POSICAO: Record<Posicao, string> = {
  GOLEIRO: "Goleiro",
  FIXO: "Fixo",
  ALA_ESQ: "Ala Esq.",
  ALA_DIR: "Ala Dir.",
  PIVO: "Pivô",
  BANCO: "Banco",
}
