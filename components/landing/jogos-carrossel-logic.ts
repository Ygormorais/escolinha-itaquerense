export interface Foco {
  aba: number
  card: number
}

/** Avança o foco do carrossel: próximo card, próxima aba, ou volta ao início. */
export function proximoFoco(foco: Foco, tamanhos: number[]): Foco {
  if (tamanhos.length === 0) return { aba: 0, card: 0 }
  const cardsNaAba = tamanhos[foco.aba] ?? 0
  if (foco.card + 1 < cardsNaAba) {
    return { aba: foco.aba, card: foco.card + 1 }
  }
  const proximaAba = foco.aba + 1
  if (proximaAba < tamanhos.length) {
    return { aba: proximaAba, card: 0 }
  }
  return { aba: 0, card: 0 }
}
