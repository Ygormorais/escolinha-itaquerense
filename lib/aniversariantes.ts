export type AlunoNascimento = { id: number; nome: string; dataNascimento: Date }

export type Aniversariante = AlunoNascimento & {
  dia: number
  idadeQueCompleta: number
  ehHoje: boolean
}

export function ehAniversarioNoDia(dataNascimento: Date, dia: Date): boolean {
  return (
    dataNascimento.getDate() === dia.getDate() &&
    dataNascimento.getMonth() === dia.getMonth()
  )
}

/** Aniversariantes do mês de `ref`, ordenados por dia. */
export function aniversariantesDoMes(
  alunos: AlunoNascimento[],
  ref: Date = new Date()
): Aniversariante[] {
  return alunos
    .filter((a) => a.dataNascimento.getMonth() === ref.getMonth())
    .map((a) => ({
      ...a,
      dia: a.dataNascimento.getDate(),
      idadeQueCompleta: ref.getFullYear() - a.dataNascimento.getFullYear(),
      ehHoje: ehAniversarioNoDia(a.dataNascimento, ref),
    }))
    .sort((a, b) => a.dia - b.dia)
}
