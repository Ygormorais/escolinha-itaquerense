export type AlunoNascimento = { id: number; nome: string; dataNascimento: Date }

export type Aniversariante = AlunoNascimento & {
  dia: number
  idadeQueCompleta: number
  ehHoje: boolean
  ehEstaSemana: boolean
}

/** Retorna true quando `dataNascimento` cai no mesmo dia/mês de `dia`. Aniversários em 29/fev só batem em anos bissextos — comportamento intencional. */
export function ehAniversarioNoDia(dataNascimento: Date, dia: Date): boolean {
  return (
    dataNascimento.getDate() === dia.getDate() &&
    dataNascimento.getMonth() === dia.getMonth()
  )
}

/** Aniversariantes do mês de `ref`, ordenados por dia.
 *
 * @param ref  Escopa o mês exibido e o ano usado em `idadeQueCompleta`.
 * @param hoje Data usada exclusivamente para o badge `ehHoje`. Padrão: `new Date()`.
 */
export function aniversariantesDoMes(
  alunos: AlunoNascimento[],
  ref: Date = new Date(),
  hoje: Date = new Date()
): Aniversariante[] {
  const em7dias = new Date(hoje)
  em7dias.setDate(hoje.getDate() + 6)

  return alunos
    .filter((a) => a.dataNascimento.getMonth() === ref.getMonth())
    .map((a) => {
      const diaNasc = a.dataNascimento.getDate()
      const mesNasc = a.dataNascimento.getMonth()
      // Verifica se o aniversário cai entre hoje e +6 dias (dentro do mesmo mês)
      const aniMes = mesNasc === ref.getMonth()
      const ehEstaSemana = aniMes && diaNasc >= hoje.getDate() && diaNasc <= em7dias.getDate()
      return {
        ...a,
        dia: diaNasc,
        idadeQueCompleta: ref.getFullYear() - a.dataNascimento.getFullYear(),
        ehHoje: ehAniversarioNoDia(a.dataNascimento, hoje),
        ehEstaSemana,
      }
    })
    .sort((a, b) => a.dia - b.dia)
}
