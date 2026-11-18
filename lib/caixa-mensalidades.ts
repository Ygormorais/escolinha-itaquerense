export type ReciboDoCaixa = {
  id: number
  valor: number
  formaPagamento: string
  dataPagamento: Date
  mesReferencia: string
  pagamento: { aluno: { id: number; nome: string; turma: string } } | null
}

/**
 * Recebimentos de mensalidade do período a partir dos recibos (um por baixa, com valor e forma
 * próprios). Somar o acumulado da mensalidade contaria de novo as baixas parciais de meses
 * anteriores e atribuiria tudo à forma da última baixa.
 */
export function resumirRecibosDoCaixa(recibos: ReciboDoCaixa[]) {
  const lancamentos = recibos.map((r) => ({
    id: r.id,
    mesReferencia: r.mesReferencia,
    dataPagamento: r.dataPagamento,
    formaPagamento: r.formaPagamento,
    valorRecebido: r.valor,
    aluno: r.pagamento?.aluno ?? { id: 0, nome: "—", turma: "" },
  }))
  const total = recibos.reduce((soma, r) => soma + r.valor, 0)
  const porForma: Record<string, number> = {}
  for (const r of recibos) {
    const forma = r.formaPagamento || "Outros"
    porForma[forma] = (porForma[forma] ?? 0) + r.valor
  }
  return { lancamentos, total, porForma }
}

export type PagamentoSemRecibo = {
  id: number
  valorRecebido: number | null
  formaPagamento: string | null
  dataPagamento: Date
  mesReferencia: string
  aluno: { id: number; nome: string; turma: string }
}

/**
 * Baixas sem recibo ativo (recibo que falhou ao emitir ou pagamento antigo) entram no caixa como
 * uma linha da mensalidade, para o dinheiro recebido nunca sumir do total.
 */
export function pagamentosSemReciboComoRecibos(pagamentos: PagamentoSemRecibo[]): ReciboDoCaixa[] {
  return pagamentos
    .filter((p) => (p.valorRecebido ?? 0) > 0)
    .map((p) => ({
      id: -p.id, // negativo: não colide com o id de um recibo real
      valor: p.valorRecebido ?? 0,
      formaPagamento: p.formaPagamento ?? "Outros",
      dataPagamento: p.dataPagamento,
      mesReferencia: p.mesReferencia,
      pagamento: { aluno: p.aluno },
    }))
}
