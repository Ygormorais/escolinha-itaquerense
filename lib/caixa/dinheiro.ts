export type EntradaDinheiro = {
  origem: string
  detalhe: string
  valor: number
  data: Date | string
  tipo: "Mensalidade" | "Avulso"
}

type PagamentoDinheiro = {
  valorRecebido: number | null
  dataPagamento: Date | string | null
  mesReferencia: string
  aluno: { nome: string; turma: string }
}

type RecebimentoAvulso = {
  descricao: string
  categoria: string
  valor: number
  data: Date | string
}

/**
 * Normaliza mensalidades pagas em dinheiro (Pagamento) e entradas avulsas
 * (Recebimento) numa lista unificada ordenada por data desc.
 */
export function mergeRecebimentosDinheiro(
  pagamentos: PagamentoDinheiro[],
  recebimentos: RecebimentoAvulso[]
): EntradaDinheiro[] {
  const deMensalidades: EntradaDinheiro[] = pagamentos.map((p) => ({
    origem: p.aluno.nome,
    detalhe: p.aluno.turma,
    valor: p.valorRecebido ?? 0,
    data: p.dataPagamento ?? new Date(0),
    tipo: "Mensalidade",
  }))

  const deAvulsos: EntradaDinheiro[] = recebimentos.map((r) => ({
    origem: r.descricao,
    detalhe: r.categoria,
    valor: r.valor,
    data: r.data,
    tipo: "Avulso",
  }))

  return [...deMensalidades, ...deAvulsos].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  )
}
