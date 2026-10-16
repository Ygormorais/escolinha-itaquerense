import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { AlertItem } from "@/components/dashboard/alert-banner"
import { plural } from "@/lib/utils"

type FrequencyCount = {
  presenca: string
  _count: { _all: number }
}

type GroupedPaymentCount = {
  _count: { _all: number }
}

export function summarizeFrequency(rows: FrequencyCount[]) {
  const total = rows.reduce((sum, row) => sum + row._count._all, 0)
  const present = rows.find((row) => row.presenca === "Presente")?._count._all ?? 0

  return {
    present,
    total,
    percentage: total > 0 ? Math.round((present / total) * 100) : 0,
  }
}

export function summarizeOverduePayments(rows: GroupedPaymentCount[]) {
  return {
    payments: rows.reduce((sum, row) => sum + row._count._all, 0),
    students: rows.length,
  }
}

function rotuloMes(mes: string) {
  const [year, month] = mes.split("-")
  return format(new Date(Number(year), Number(month) - 1), "MMM/yy", { locale: ptBR })
}

/** Recebido x custos por mês ("yyyy-MM"), na ordem de `meses`. */
export function serieReceitaCustos(
  meses: string[],
  pagamentos: { dataPagamento: Date | null; valorRecebido: number | null }[],
  custos: { data: Date; valor: number }[],
) {
  return meses.map((mes) => {
    const recebido = pagamentos
      .filter((p) => p.dataPagamento && format(p.dataPagamento, "yyyy-MM") === mes)
      .reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
    const totalCustos = custos
      .filter((c) => format(c.data, "yyyy-MM") === mes)
      .reduce((s, c) => s + c.valor, 0)
    return { mes: rotuloMes(mes), recebido, custos: totalCustos }
  })
}

/** Mensalidades pagas x em aberto por mês de referência, com a taxa de inadimplência. */
export function serieInadimplencia(
  meses: string[],
  pagamentos: { mesReferencia: string; dataPagamento: Date | null }[],
) {
  return meses.map((mes) => {
    const registros = pagamentos.filter((p) => p.mesReferencia === mes)
    const pagas = registros.filter((p) => p.dataPagamento).length
    const vencidas = registros.length - pagas
    const total = registros.length
    return { mes: rotuloMes(mes), pagas, vencidas, taxa: total > 0 ? Math.round((vencidas / total) * 100) : 0 }
  })
}

/** Receita do mês por turma, omitindo turmas sem pagamento. */
export function receitaPorTurma(
  turmas: readonly string[],
  pagamentosMes: { valorRecebido: number | null; aluno: { turma: string } }[],
) {
  return turmas.map((turma) => {
    const receita = pagamentosMes
      .filter((p) => p.aluno.turma === turma)
      .reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
    const alunos = pagamentosMes.filter((p) => p.aluno.turma === turma).length
    return { turma, receita, alunos }
  }).filter((t) => t.alunos > 0)
}

export type AlunoEmRisco = {
  id: number
  nome: string
  turma: string
  pctFreq: number | null
  mesesAtraso: number
}

/**
 * Inadimplentes sem chamada no mês ou com presença abaixo de 60%, do maior
 * atraso para o menor (no máximo 8).
 */
export function alunosEmRiscoDeEvasao<T extends {
  id: number
  nome: string
  turma: string
  frequencias: { presenca: string }[]
  pagamentos: unknown[]
}>(alunos: T[]) {
  return alunos
    .map((a) => {
      const total = a.frequencias.length
      const presentes = a.frequencias.filter((f) => f.presenca === "Presente").length
      const pctFreq = total > 0 ? Math.round((presentes / total) * 100) : null
      return { ...a, pctFreq, mesesAtraso: a.pagamentos.length }
    })
    .filter((a) => a.pctFreq === null || a.pctFreq < 60)
    .sort((a, b) => a.mesesAtraso - b.mesesAtraso)
    .reverse()
    .slice(0, 8)
}

export function alertasDashboard({
  mensalidadesVencidas,
  presencaMedia,
  totalFrequencias,
  vencendoSemana,
  riscoEvasao,
}: {
  mensalidadesVencidas: number
  presencaMedia: number
  totalFrequencias: number
  vencendoSemana: number
  riscoEvasao: number
}) {
  const alerts: AlertItem[] = []
  if (mensalidadesVencidas > 5) {
    alerts.push({ type: "danger", icon: "alerta", message: `${mensalidadesVencidas} mensalidades em atraso`, detail: "Regularize os pagamentos pendentes para evitar acumulação.", href: "/inadimplencia" })
  }
  if (mensalidadesVencidas > 0 && mensalidadesVencidas <= 5) {
    alerts.push({ type: "warning", icon: "alerta", message: `${plural(mensalidadesVencidas, "mensalidade", "mensalidades", "nenhuma")} em atraso`, detail: "Poucos casos, mas requer atenção.", href: "/inadimplencia" })
  }
  if (presencaMedia < 50 && totalFrequencias > 0) {
    alerts.push({ type: "danger", icon: "frequencia", message: "Presença média baixa", detail: `Apenas ${presencaMedia}% no mês atual.`, href: "/frequencia" })
  }
  if (presencaMedia >= 50 && presencaMedia < 75 && totalFrequencias > 0) {
    alerts.push({ type: "warning", icon: "frequencia", message: "Presença média moderada", detail: `${presencaMedia}% no mês atual.`, href: "/frequencia" })
  }
  if (vencendoSemana > 0) {
    alerts.push({ type: "info", icon: "tendencia", message: `${plural(vencendoSemana, "mensalidade vence", "mensalidades vencem", "nenhuma")} nos próximos 7 dias`, detail: "Lembrar de cobrar antes do vencimento.", href: "/pagamentos" })
  }
  if (riscoEvasao >= 3) {
    alerts.push({ type: "warning", icon: "alerta", message: `${riscoEvasao} alunos em risco de evasão`, detail: "Inadimplentes com presença abaixo de 60% este mês.", href: "/alunos" })
  }
  return alerts
}
