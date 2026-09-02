export type PrioridadeDesenvolvimento = "alta" | "media" | "baixa"

export type TipoInsightDesenvolvimento =
  | "frequencia_em_queda"
  | "baixa_frequencia"
  | "avaliacao_atrasada"
  | "poucas_oportunidades"
  | "evolucao_positiva"
  | "avaliacao_estavel"

export type RegistroFrequencia = {
  data: Date
  presenca: string
}

export type RegistroAvaliacao = {
  periodo: string
  notaTecnica: number | null
  notaFisica: number | null
  notaComportamento: number | null
  createdAt: Date
}

export type AtletaDesenvolvimento = {
  id: number
  nome: string
  turma: string
  dataMatricula: Date
  frequencias: RegistroFrequencia[]
  avaliacoes: RegistroAvaliacao[]
  datasConvocacoes: Date[]
}

export type InsightDesenvolvimento = {
  id: string
  alunoId: number
  alunoNome: string
  turma: string
  tipo: TipoInsightDesenvolvimento
  prioridade: PrioridadeDesenvolvimento
  titulo: string
  explicacao: string
  evidencias: string[]
  acaoSugerida: string
  positivo: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY_MS)
}

function isPresent(value: string): boolean {
  return value.trim().toLocaleLowerCase("pt-BR") === "presente"
}

function attendance(records: RegistroFrequencia[]): number | null {
  if (records.length === 0) return null
  return Math.round((records.filter((record) => isPresent(record.presenca)).length / records.length) * 100)
}

function assessmentAverage(record: RegistroAvaliacao): number | null {
  const values = [record.notaTecnica, record.notaFisica, record.notaComportamento]
    .filter((value): value is number => value !== null)
  if (values.length === 0) return null
  return values.reduce((total, value) => total + value, 0) / values.length
}

function baseInsight(
  athlete: AtletaDesenvolvimento,
  type: TipoInsightDesenvolvimento,
  data: Omit<InsightDesenvolvimento, "id" | "alunoId" | "alunoNome" | "turma" | "tipo">
): InsightDesenvolvimento {
  return {
    id: `${athlete.id}:${type}`,
    alunoId: athlete.id,
    alunoNome: athlete.nome,
    turma: athlete.turma,
    tipo: type,
    ...data,
  }
}

export function gerarInsightsDesenvolvimento(
  athlete: AtletaDesenvolvimento,
  options: { now?: Date; recentMatches?: number } = {}
): InsightDesenvolvimento[] {
  const now = options.now ?? new Date()
  const recentMatches = options.recentMatches ?? 0
  const currentStart = daysAgo(now, 30)
  const previousStart = daysAgo(now, 60)
  const opportunityStart = daysAgo(now, 90)
  const assessmentLimit = daysAgo(now, 180)
  const initialAssessmentGrace = daysAgo(now, 90)

  const currentWindow = athlete.frequencias.filter((item) => item.data >= currentStart && item.data <= now)
  const previousWindow = athlete.frequencias.filter((item) => item.data >= previousStart && item.data < currentStart)
  const opportunityWindow = athlete.frequencias.filter((item) => item.data >= opportunityStart && item.data >= athlete.dataMatricula && item.data <= now)
  const currentAttendance = attendance(currentWindow)
  const previousAttendance = attendance(previousWindow)
  const opportunityAttendance = attendance(opportunityWindow)
  const insights: InsightDesenvolvimento[] = []

  if (
    currentWindow.length >= 3 &&
    previousWindow.length >= 3 &&
    currentAttendance !== null &&
    previousAttendance !== null &&
    previousAttendance - currentAttendance >= 20
  ) {
    insights.push(baseInsight(athlete, "frequencia_em_queda", {
      prioridade: "alta",
      titulo: "Frequência em queda",
      explicacao: "A presença caiu de forma relevante em comparação com os 30 dias anteriores.",
      evidencias: [
        `${currentAttendance}% de presença nos últimos 30 dias (${currentWindow.length} registros)`,
        `${previousAttendance}% nos 30 dias anteriores (${previousWindow.length} registros)`,
      ],
      acaoSugerida: "Conversar com o atleta e a família para identificar barreiras de participação.",
      positivo: false,
    }))
  } else if (currentWindow.length >= 3 && currentAttendance !== null && currentAttendance < 70) {
    insights.push(baseInsight(athlete, "baixa_frequencia", {
      prioridade: "alta",
      titulo: "Frequência abaixo do esperado",
      explicacao: "A presença recente está abaixo do limite de acompanhamento de 70%.",
      evidencias: [`${currentAttendance}% de presença nos últimos 30 dias (${currentWindow.length} registros)`],
      acaoSugerida: "Verificar faltas recorrentes e combinar um plano simples de retomada.",
      positivo: false,
    }))
  }

  const orderedAssessments = [...athlete.avaliacoes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  const latestAssessment = orderedAssessments[0]
  if (
    athlete.dataMatricula <= initialAssessmentGrace &&
    (!latestAssessment || latestAssessment.createdAt < assessmentLimit)
  ) {
    insights.push(baseInsight(athlete, "avaliacao_atrasada", {
      prioridade: "media",
      titulo: "Avaliação de desenvolvimento pendente",
      explicacao: latestAssessment
        ? "A última avaliação registrada tem mais de seis meses."
        : "Ainda não há uma avaliação registrada após o período inicial de matrícula.",
      evidencias: [latestAssessment ? `Última avaliação: ${latestAssessment.periodo}` : "Nenhuma avaliação registrada"],
      acaoSugerida: "Agendar uma avaliação técnica, física e comportamental.",
      positivo: false,
    }))
  }

  const recentCallUps = athlete.datasConvocacoes.filter((date) => date >= opportunityStart && date <= now).length
  if (
    recentMatches > 0 &&
    opportunityWindow.length >= 4 &&
    opportunityAttendance !== null &&
    opportunityWindow.filter((item) => isPresent(item.presenca)).length / opportunityWindow.length >= 0.8 &&
    recentCallUps === 0
  ) {
    insights.push(baseInsight(athlete, "poucas_oportunidades", {
      prioridade: "media",
      titulo: "Boa presença sem convocação recente",
      explicacao: "O atleta tem participação consistente nos treinos, mas não possui convocação registrada no período.",
      evidencias: [
        `${opportunityAttendance}% de presença nos últimos 90 dias (${opportunityWindow.length} registros)`,
        `0 convocações em ${recentMatches} jogo(s) registrado(s) no período`,
      ],
      acaoSugerida: "Revisar com a comissão se existe uma oportunidade adequada de participação.",
      positivo: false,
    }))
  }

  const latestAverage = latestAssessment ? assessmentAverage(latestAssessment) : null
  const previousAssessment = orderedAssessments[1]
  const previousAverage = previousAssessment ? assessmentAverage(previousAssessment) : null
  if (latestAverage !== null && previousAverage !== null) {
    const variation = latestAverage - previousAverage
    if (variation >= 0.75) {
      insights.push(baseInsight(athlete, "evolucao_positiva", {
        prioridade: "baixa",
        titulo: "Evolução consistente nas avaliações",
        explicacao: "A média das dimensões avaliadas melhorou em relação ao período anterior.",
        evidencias: [
          `Média atual: ${latestAverage.toFixed(1)} (${latestAssessment.periodo})`,
          `Média anterior: ${previousAverage.toFixed(1)} (${previousAssessment.periodo})`,
        ],
        acaoSugerida: "Reconhecer a evolução e definir o próximo objetivo com o atleta.",
        positivo: true,
      }))
    } else if (Math.abs(variation) <= 0.25) {
      insights.push(baseInsight(athlete, "avaliacao_estavel", {
        prioridade: "baixa",
        titulo: "Desenvolvimento estável",
        explicacao: "As duas últimas médias de avaliação ficaram praticamente no mesmo nível.",
        evidencias: [
          `Média atual: ${latestAverage.toFixed(1)} (${latestAssessment.periodo})`,
          `Média anterior: ${previousAverage.toFixed(1)} (${previousAssessment.periodo})`,
        ],
        acaoSugerida: "Definir uma meta específica e mensurável para o próximo ciclo.",
        positivo: false,
      }))
    }
  }

  return insights
}

export function inicioDaSemana(date: Date): string {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  const daysSinceMonday = (value.getDay() + 6) % 7
  value.setDate(value.getDate() - daysSinceMonday)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, "0")
  const day = String(value.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function insightKeySemanal(insight: Pick<InsightDesenvolvimento, "id">, date: Date): string {
  return `${insight.id}:${inicioDaSemana(date)}`
}
