/** Recibo válido (não cancelado) de uma baixa da mensalidade. */
export type ReciboDeclaracao = {
  valor: number
  dataPagamento: Date
  formaPagamento: string
}

export type PagamentoDeclaracao = {
  mesReferencia: string
  dataPagamento: Date | null
  valorRecebido: number | null
  formaPagamento: string | null
  /** Recibos não cancelados; quando há, cada baixa vira uma linha (inclui baixas parciais). */
  recibos?: ReciboDeclaracao[]
}

export type LinhaDeclaracao = {
  mesReferencia: string
  dataPagamento: Date
  valorRecebido: number | null
  formaPagamento: string | null
}

export type DeclaracaoAnual = {
  ano: number
  linhas: LinhaDeclaracao[]
  total: number
}

/**
 * Valores recebidos no ano. Mensalidades com recibo usam cada recibo (data e valor da baixa),
 * para que pagamentos parciais entrem no ano em que o dinheiro foi recebido. Registros antigos,
 * sem recibo, usam a quitação da mensalidade.
 */
export function montarDeclaracaoAnual(
  pagamentos: PagamentoDeclaracao[],
  ano: number
): DeclaracaoAnual {
  const linhas: LinhaDeclaracao[] = []
  for (const p of pagamentos) {
    if (p.recibos && p.recibos.length > 0) {
      for (const r of p.recibos) {
        linhas.push({ mesReferencia: p.mesReferencia, dataPagamento: r.dataPagamento, valorRecebido: r.valor, formaPagamento: r.formaPagamento })
      }
    } else if (p.dataPagamento) {
      linhas.push({ mesReferencia: p.mesReferencia, dataPagamento: p.dataPagamento, valorRecebido: p.valorRecebido, formaPagamento: p.formaPagamento })
    }
  }
  const doAno = linhas
    .filter((l) => l.dataPagamento.getFullYear() === ano)
    .sort((a, b) => a.dataPagamento.getTime() - b.dataPagamento.getTime())
  const total = Math.round(doAno.reduce((s, l) => s + (l.valorRecebido ?? 0), 0) * 100) / 100
  return { ano, linhas: doAno, total }
}
