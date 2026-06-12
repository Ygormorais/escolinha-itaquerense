export type PagamentoDeclaracao = {
  mesReferencia: string
  dataPagamento: Date | null
  valorRecebido: number | null
  formaPagamento: string | null
}

export type DeclaracaoAnual = {
  ano: number
  linhas: (PagamentoDeclaracao & { dataPagamento: Date })[]
  total: number
}

export function montarDeclaracaoAnual(
  pagamentos: PagamentoDeclaracao[],
  ano: number
): DeclaracaoAnual {
  const linhas = pagamentos
    .filter((p): p is PagamentoDeclaracao & { dataPagamento: Date } =>
      p.dataPagamento != null && p.dataPagamento.getFullYear() === ano
    )
    .sort((a, b) => a.dataPagamento.getTime() - b.dataPagamento.getTime())
  const total = linhas.reduce((s, l) => s + (l.valorRecebido ?? 0), 0)
  return { ano, linhas, total }
}
