/** Vagas por turma para exibir à família: só a situação e o número de vagas, nunca dados de alunos. */
export const LIMITE_POUCAS_VAGAS = 3

export type NivelVagas = "disponivel" | "poucas" | "lotada"

export type SituacaoVagas = {
  nivel: NivelVagas
  restantes: number
  rotulo: string
}

export function situacaoVagas(capacidade: number, ocupacao: number): SituacaoVagas {
  const restantes = Math.max(0, Math.floor(capacidade) - Math.max(0, Math.floor(ocupacao)))
  if (restantes === 0) return { nivel: "lotada", restantes, rotulo: "Turma lotada" }
  if (restantes <= LIMITE_POUCAS_VAGAS) {
    return { nivel: "poucas", restantes, rotulo: restantes === 1 ? "Última vaga" : `Últimas ${restantes} vagas` }
  }
  return { nivel: "disponivel", restantes, rotulo: "Vagas disponíveis" }
}
