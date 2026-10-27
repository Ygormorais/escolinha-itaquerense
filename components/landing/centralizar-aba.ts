interface Retangulo {
  left: number
  width: number
}

/**
 * Posição de `scrollLeft` que deixa a aba no centro da faixa de abas.
 * `container` e `aba` vêm de getBoundingClientRect (mesmo referencial de tela).
 */
export function scrollLeftParaCentralizar(container: Retangulo & { scrollLeft: number }, aba: Retangulo): number {
  const alvo = container.scrollLeft + (aba.left - container.left) - (container.width - aba.width) / 2
  return Math.max(0, alvo)
}

/**
 * Centraliza a aba ativa rolando só a faixa de abas na horizontal. Não usa
 * `scrollIntoView`, que também rola a página e jogava o visitante até as abas
 * assim que a landing carregava.
 */
export function centralizarAba(faixa: HTMLElement, ativa: HTMLElement) {
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const f = faixa.getBoundingClientRect()
  const a = ativa.getBoundingClientRect()
  faixa.scrollTo({
    left: scrollLeftParaCentralizar({ left: f.left, width: f.width, scrollLeft: faixa.scrollLeft }, { left: a.left, width: a.width }),
    behavior: reduzir ? "auto" : "smooth",
  })
}
