/** Quanto uma mensalidade vale: mensalidade − desconto do aluno, nunca negativo. */
export function valorDevidoDoAluno(aluno: { mensalidade: number; desconto: number }): number {
  return Math.max(0, aluno.mensalidade - aluno.desconto)
}

/** Valor gravado na mensalidade; registros sem o campo usam o valor atual do aluno. */
export function valorDevidoDoPagamento(p: {
  valorDevido: number | null
  aluno: { mensalidade: number; desconto: number }
}): number {
  return p.valorDevido ?? valorDevidoDoAluno(p.aluno)
}

/** Quanto ainda falta pagar: valor devido menos o já recebido (baixas parciais), nunca negativo. */
export function restanteDoPagamento(p: {
  valorDevido: number | null
  valorRecebido: number | null
  aluno: { mensalidade: number; desconto: number }
}): number {
  return Math.max(0, valorDevidoDoPagamento(p) - (p.valorRecebido ?? 0))
}
