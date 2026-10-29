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
