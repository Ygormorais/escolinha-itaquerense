export type AlunoCategoria = { id: number; nome: string; dataNascimento: Date; turma: string }

export type ViradaProposta = {
  id: number
  nome: string
  dataNascimento: Date
  idadeNoAno: number
  turmaAtual: string
  turmaProposta: string | null
  acimaDoMaximo: boolean
}

/** Extrai os N de turmas "Sub-N" existentes, únicos e ordenados. */
export function extrairCategorias(turmas: string[]): number[] {
  const ns = new Set<number>()
  for (const t of turmas) {
    const m = /^Sub-(\d+)$/.exec(t.trim())
    if (m) ns.add(Number(m[1]))
  }
  return [...ns].sort((a, b) => a - b)
}

/** Menor Sub-N que comporta a idade completada no ano de referência; null se acima de todas. */
export function categoriaIdeal(
  dataNascimento: Date,
  anoRef: number,
  categorias: number[]
): string | null {
  const idadeNoAno = anoRef - dataNascimento.getFullYear()
  const n = categorias.find((c) => idadeNoAno <= c)
  return n == null ? null : `Sub-${n}`
}

export function calcularViradas(
  alunos: AlunoCategoria[],
  anoRef: number,
  categorias: number[]
): ViradaProposta[] {
  return alunos
    .map((a) => {
      const proposta = categoriaIdeal(a.dataNascimento, anoRef, categorias)
      return {
        id: a.id,
        nome: a.nome,
        dataNascimento: a.dataNascimento,
        idadeNoAno: anoRef - a.dataNascimento.getFullYear(),
        turmaAtual: a.turma,
        turmaProposta: proposta,
        acimaDoMaximo: proposta == null,
      }
    })
    .filter((v) => v.turmaProposta !== v.turmaAtual)
}
