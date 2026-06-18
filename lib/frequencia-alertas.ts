export const LIMITE_QUEDA = 70
export const MIN_REGISTROS = 4

export function estaEmQueda(
  aluno: { pct: number; total: number },
  limite = LIMITE_QUEDA,
  minRegistros = MIN_REGISTROS
): boolean {
  return aluno.total >= minRegistros && aluno.pct < limite
}

export function filtrarEmQueda<T extends { pct: number; total: number }>(
  alunos: T[],
  limite = LIMITE_QUEDA,
  minRegistros = MIN_REGISTROS
): T[] {
  return alunos.filter((a) => estaEmQueda(a, limite, minRegistros))
}
