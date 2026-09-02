export function mesAtualBrasil(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(now)
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`
}

export function mesesResumoFamiliar(now = new Date()) {
  const [ano, mes] = mesAtualBrasil(now).split("-").map(Number)
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.UTC(ano, mes - 1 - index, 1, 12))
    return { value: date.toISOString().slice(0, 7), label: date.toLocaleDateString("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" }) }
  })
}

export function recorteResumoFamiliar(mes: string, now: Date) {
  const option = mesesResumoFamiliar(now).find((item) => item.value === mes)
  if (!option) return null
  const [ano, numero] = mes.split("-").map(Number)
  // Frequência guarda uma data civil (entrada manual em UTC 00h, scanner em
  // UTC 12h). Avaliações guardam um instante real de criação, no fuso da escola.
  const inicioFrequencia = new Date(Date.UTC(ano, numero - 1, 1))
  const fimFrequencia = new Date(Date.UTC(ano, numero, 1))
  const inicioEventos = new Date(Date.UTC(ano, numero - 1, 1, 3))
  const fimEventos = new Date(Date.UTC(ano, numero, 1, 3))
  const hojeBrasil = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
  const amanhaCivil = new Date(new Date(`${hojeBrasil}T00:00:00Z`).getTime() + 86400000)
  return {
    mes, label: option.label, parcial: mes === mesAtualBrasil(now),
    inicioFrequencia, fimFrequencia: new Date(Math.min(fimFrequencia.getTime(), amanhaCivil.getTime())),
    inicioEventos, fimEventos,
  }
}

export type ResumoFamiliar = {
  mes: string
  periodo: string
  parcial: boolean
  evidencias: string[]
  texto: string
}

export type ResumoFamiliarSalvo = {
  id: number
  mes: string
  texto: string
  usuario: string
  createdAt: string
}

export function montarResumoFamiliar(input: {
  nome: string
  mes: string
  periodo: string
  parcial: boolean
  presencas: string[]
  avaliacoesRegistradas: number
}): ResumoFamiliar {
  const presentes = input.presencas.filter((value) => value === "Presente").length
  const ausentes = input.presencas.filter((value) => value === "Ausente").length
  const justificados = input.presencas.filter((value) => value === "Justificado").length
  const total = presentes + ausentes + justificados
  const evidencias = [
    total ? `${presentes} presença(s), ${ausentes} ausência(s) e ${justificados} falta(s) justificada(s), em ${total} registro(s).` : "Nenhum registro de frequência no período.",
    `${input.avaliacoesRegistradas} avaliação(ões) cadastrada(s) no período.`,
  ]
  if (total !== input.presencas.length) evidencias.push("Há registros com situação não reconhecida; eles não entraram na contagem.")
  const frequencia = total
    ? `Os registros de frequência mostram ${presentes} presença(s) em ${total} registro(s) de treino, com ${ausentes} ausência(s) e ${justificados} falta(s) justificada(s).`
    : "Ainda não temos registros de frequência neste período para compor o acompanhamento. Isso não significa que houve faltas."
  const avaliacao = input.avaliacoesRegistradas
    ? `A equipe cadastrou ${input.avaliacoesRegistradas} avaliação(ões) neste período. Podemos conversar sobre os pontos registrados e combinar os próximos passos.`
    : "Nenhuma nova avaliação foi cadastrada neste período. Esse resumo não permite concluir melhora ou queda no desenvolvimento."
  return {
    mes: input.mes, periodo: input.periodo, parcial: input.parcial, evidencias,
    texto: `Olá, família de ${input.nome}!\n\nCompartilhamos o acompanhamento de ${input.periodo}${input.parcial ? " (mês em andamento, com dados parciais)" : ""}.\n\n${frequencia}\n\n${avaliacao}\n\nSe houver alguma informação a complementar, estamos à disposição para conversar e acompanhar o atleta em conjunto.`,
  }
}
