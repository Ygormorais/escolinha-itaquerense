export function podeResponder(dataPartida: Date, agora: Date = new Date()): boolean {
  return agora.getTime() <= dataPartida.getTime()
}

type EscaladoNotificacao = {
  alunoId: number
  confirmacao: string | null
  aluno: { responsavelId: number | null }
}

/** IDs de responsáveis a notificar (únicos). Em re-convocação, só de quem não respondeu. */
export function quemNotificar(escalados: EscaladoNotificacao[], reconvocacao: boolean): number[] {
  const alvo = reconvocacao ? escalados.filter((e) => e.confirmacao == null) : escalados
  return [...new Set(alvo.map((e) => e.aluno.responsavelId).filter((id): id is number => id != null))]
}

export function resumoConfirmacoes(escalados: { confirmacao: string | null }[]) {
  return {
    confirmados: escalados.filter((e) => e.confirmacao === "confirmado").length,
    ausentes: escalados.filter((e) => e.confirmacao === "ausente").length,
    semResposta: escalados.filter((e) => e.confirmacao == null).length,
  }
}
