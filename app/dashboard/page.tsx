import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { db } from "@/lib/db"
import { formatMoney } from "@/lib/utils"
import { PageHeader, PageHeaderDateNav } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Users, TrendingUp, AlertCircle, CalendarCheck, TrendingDown } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import dynamic from "next/dynamic"
import { MonthPicker } from "@/app/caixa/month-picker"
import { GerarMesButton } from "@/components/dashboard/gerar-mes-button"
import { getConfig } from "@/lib/config"
import { getQtdeAlunosEmQueda } from "@/app/actions/frequencia"
import { TURMAS } from "@/lib/constants"
import { AlertBanner } from "@/components/dashboard/alert-banner"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ResumoFinanceiro } from "@/components/dashboard/resumo-financeiro"
import { AniversariantesCard } from "@/components/dashboard/aniversariantes-card"
import { OcupacaoTurmasCard } from "@/components/dashboard/ocupacao-turmas-card"
import { RiscoEvasaoCard } from "@/components/dashboard/risco-evasao-card"
import { MensalidadesAtrasoCard, UltimosPagamentosCard } from "@/components/dashboard/ultimos-pagamentos-card"
import { VencendoSemanaCard } from "@/components/dashboard/vencendo-semana-card"
import { aniversariantesDoMes } from "@/lib/aniversariantes"
import { requireAuth } from "@/lib/auth"
import { normalizeDashboardMonth } from "@/lib/dashboard-query"
import {
  alertasDashboard,
  alunosEmRiscoDeEvasao,
  receitaPorTurma,
  serieInadimplencia,
  serieReceitaCustos,
  summarizeFrequency,
  summarizeOverduePayments,
} from "@/lib/dashboard-metrics"
import { canAccessStaffPath, isStaffRole } from "@/lib/permissions"

const ChartReceitaCustos = dynamic(() => import("@/components/dashboard/chart-receita-custos").then(m => ({ default: m.ChartReceitaCustos })), { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> })
const ChartInadimplencia = dynamic(() => import("@/components/dashboard/chart-inadimplencia").then(m => ({ default: m.ChartInadimplencia })), { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> })
const ChartReceitaPorTurma = dynamic(() => import("@/components/dashboard/chart-receita-turma").then(m => ({ default: m.ChartReceitaPorTurma })), { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> })

export const metadata = { title: "Dashboard — Escolinha Itaquerense" }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string | string[] }>
}) {
  const [{ role: sessionRole }, params] = await Promise.all([
    requireAuth(["admin", "secretaria", "tecnico"]),
    searchParams,
  ])
  if (!isStaffRole(sessionRole)) {
    throw new Error("Perfil administrativo inválido.")
  }
  const role = sessionRole
  const canViewPayments = canAccessStaffPath("/pagamentos", role)
  const canViewCash = canAccessStaffPath("/caixa", role)
  const now = new Date()
  const mesSelecionado = normalizeDashboardMonth(params.mes, now)

  const [anoRef, mesRef] = mesSelecionado.split("-").map(Number)
  const dataRef = new Date(anoRef, mesRef - 1, 1)
  const mesAtual = mesSelecionado
  const inicioMes = startOfMonth(dataRef)
  const fimMes = endOfMonth(dataRef)
  const mesAnterior = format(subMonths(dataRef, 1), "yyyy-MM")

  const sixMonthsAgo = subMonths(startOfMonth(dataRef), 5)

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(dataRef, 5 - i)
    return format(d, "yyyy-MM")
  })

  const config = getConfig()

  const [
    pagamentosMesesRecentes,
    ultimosPagamentos,
    frequenciasPorStatus,
    inadimplentes,
    pagamentosChart,
    custosChart,
    aniversariantes,
    vencendoSemana,
    ocupacaoTurmasRaw,
    todosPagamentos6Meses,
    pagamentosVencidosPorAluno,
    alunosEmQueda,
    inadimplentesComFreqBaixa,
  ] = await Promise.all([
    canViewPayments ? db.pagamento.findMany({
      where: { mesReferencia: { in: [mesAtual, mesAnterior] }, dataPagamento: { not: null } },
      select: {
        mesReferencia: true,
        valorRecebido: true,
        aluno: { select: { turma: true } },
      },
    }) : Promise.resolve([]),
    canViewPayments ? db.pagamento.findMany({
      where: { dataPagamento: { not: null } },
      include: { aluno: { select: { id: true, nome: true, turma: true } } },
      orderBy: { dataPagamento: "desc" },
      take: 5,
    }) : Promise.resolve([]),
    db.frequencia.groupBy({
      by: ["presenca"],
      where: { data: { gte: inicioMes, lte: fimMes } },
      _count: { _all: true },
    }),
    canViewPayments ? db.pagamento.findMany({
      where: {
        mesReferencia: mesAtual,
        dataPagamento: null,
        dataVencimento: { lt: fimMes },
      },
      include: { aluno: { select: { id: true, nome: true, turma: true } } },
      orderBy: { dataVencimento: "asc" },
      take: 5,
    }) : Promise.resolve([]),
    canViewPayments ? db.pagamento.findMany({
      where: { dataPagamento: { gte: sixMonthsAgo, lte: fimMes } },
      select: { dataPagamento: true, valorRecebido: true },
    }) : Promise.resolve([]),
    canViewCash ? db.custo.findMany({
      where: { data: { gte: sixMonthsAgo, lte: fimMes } },
      select: { data: true, valor: true },
    }) : Promise.resolve([]),
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { id: true, nome: true, dataNascimento: true },
      orderBy: { dataNascimento: "asc" },
    }),
    canViewPayments ? db.pagamento.findMany({
      where: {
        dataPagamento: null,
        dataVencimento: { gte: inicioMes, lte: addDays(fimMes, 7) },
      },
      include: { aluno: { select: { id: true, nome: true, turma: true } } },
      orderBy: { dataVencimento: "asc" },
    }) : Promise.resolve([]),
    db.aluno.groupBy({
      by: ["turma"],
      where: { status: "Ativo" },
      _count: { id: true },
    }),
    canViewPayments ? db.pagamento.findMany({
      where: { mesReferencia: { in: last6Months } },
      select: { mesReferencia: true, dataPagamento: true, valorRecebido: true },
    }) : Promise.resolve([]),
    canViewPayments ? db.pagamento.groupBy({
      by: ["alunoId"],
      where: { dataPagamento: null, dataVencimento: { lt: now }, aluno: { status: "Ativo" } },
      _count: { _all: true },
    }) : Promise.resolve([]),
    getQtdeAlunosEmQueda(mesSelecionado),
    canViewPayments ? db.aluno.findMany({
      where: {
        status: "Ativo",
        pagamentos: { some: { dataPagamento: null, dataVencimento: { lt: now } } },
      },
      select: {
        id: true,
        nome: true,
        turma: true,
        frequencias: {
          where: { data: { gte: inicioMes, lte: fimMes } },
          select: { presenca: true },
        },
        pagamentos: {
          where: { dataPagamento: null, dataVencimento: { lt: now } },
          select: { mesReferencia: true },
        },
      },
      orderBy: { nome: "asc" },
    }) : Promise.resolve([]),
  ])

  const totalAtivos = ocupacaoTurmasRaw.reduce((sum, row) => sum + row._count.id, 0)
  const pagamentosMes = pagamentosMesesRecentes.filter((pagamento) => pagamento.mesReferencia === mesAtual)
  const ocupacaoTurmas = TURMAS.map((turma) => ({
    turma,
    count: ocupacaoTurmasRaw.find((row) => row.turma === turma)?._count.id ?? 0,
  }))
  const {
    total: totalFrequencias,
    percentage: presencaMedia,
  } = summarizeFrequency(frequenciasPorStatus)
  const {
    payments: mensalidadesVencidas,
    students: alunosInadimplentes,
  } = summarizeOverduePayments(pagamentosVencidosPorAluno)

  const chartData = serieReceitaCustos(last6Months, pagamentosChart, custosChart)
  const inadimplenciaData = serieInadimplencia(last6Months, todosPagamentos6Meses)
  const receitaTurmaData = receitaPorTurma(TURMAS, pagamentosMes)

  const aniversariantesMes = aniversariantesDoMes(aniversariantes, dataRef, now)

  const receitaMes = pagamentosMes.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
  const custosMes = custosChart
    .filter((c) => format(c.data, "yyyy-MM") === mesAtual)
    .reduce((s, c) => s + c.valor, 0)

  const riscoEvasao = alunosEmRiscoDeEvasao(inadimplentesComFreqBaixa)

  const alerts = alertasDashboard({
    mensalidadesVencidas,
    presencaMedia,
    totalFrequencias,
    vencendoSemana: vencendoSemana.length,
    riscoEvasao: riscoEvasao.length,
  })

  const receitaAnterior = pagamentosMesesRecentes
    .filter((pagamento) => pagamento.mesReferencia === mesAnterior)
    .reduce((sum, pagamento) => sum + (pagamento.valorRecebido ?? 0), 0)
  const custosAnterior = custosChart
    .filter((c) => format(c.data, "yyyy-MM") === mesAnterior)
    .reduce((sum, custo) => sum + custo.valor, 0)

  return (
    <div data-page="dashboard" className={PAGINA_ADMIN}>
      <PageHeader
        title="Dashboard"
        description={`Visão geral — ${format(dataRef, "MMMM yyyy", { locale: ptBR })}`}
        contextBar={
          <PageHeaderDateNav
            nav={<MonthPicker mes={mesSelecionado} basePath="/dashboard" />}
            action={canViewPayments ? <GerarMesButton mes={mesAtual} /> : undefined}
          />
        }
      />

      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      {canViewCash && (
        <ResumoFinanceiro
          receita={receitaMes}
          custos={custosMes}
          saldo={receitaMes - custosMes}
          mesAnterior={receitaAnterior > 0 || custosAnterior > 0 ? {
            receita: receitaAnterior,
            custos: custosAnterior,
          } : undefined}
        />
      )}

      <section aria-label="Indicadores do mês" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          title="Alunos Ativos"
          value={totalAtivos}
          icon={Users}
          variant="brand"
          borderAccent
          href="/alunos"
        />
        {canViewPayments && (
          <StatCard
            title="Receita do Mês"
            value={formatMoney(receitaMes)}
            icon={TrendingUp}
            variant={config.metaMensal > 0 && receitaMes >= config.metaMensal ? "success" : "brand"}
            borderAccent
            href={canViewCash ? "/caixa" : "/pagamentos"}
            progress={config.metaMensal > 0 ? {
              value: receitaMes,
              max: config.metaMensal,
              label: `de ${formatMoney(config.metaMensal)}`,
            } : undefined}
          />
        )}
        {canViewPayments && (
          <StatCard
            title="Inadimplentes"
            value={alunosInadimplentes}
            description="Alunos com mensalidade vencida"
            icon={AlertCircle}
            variant={alunosInadimplentes > 0 ? "danger" : "success"}
            href="/inadimplencia"
          />
        )}
        <StatCard
          title="Frequência em queda"
          value={alunosEmQueda}
          description="Alunos abaixo de 70% no mês"
          icon={TrendingDown}
          variant={alunosEmQueda > 0 ? "danger" : "success"}
          href="/frequencia"
        />
        <StatCard
          title="Presença Média"
          value={totalFrequencias > 0 ? `${presencaMedia}%` : "—"}
          description={totalFrequencias > 0 ? "No mês atual" : "Sem registros no mês"}
          icon={CalendarCheck}
          variant={totalFrequencias === 0 ? "default" : presencaMedia >= 75 ? "success" : presencaMedia >= 50 ? "warning" : "danger"}
          href="/frequencia"
        />
      </section>

      {/* Atalhos depois dos números: a primeira dobra fica com o que apoia decisão. */}
      <QuickActions role={role} />

      {canViewPayments && (
        <div className={canViewCash ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : undefined}>
          {canViewCash && <ChartReceitaCustos data={chartData} />}
          <ChartInadimplencia data={inadimplenciaData} />
        </div>
      )}
      {canViewPayments && <ChartReceitaPorTurma data={receitaTurmaData} />}

      <OcupacaoTurmasCard ocupacaoTurmas={ocupacaoTurmas} capacidadeTurma={config.capacidadeTurma} />

      {canViewPayments && vencendoSemana.length > 0 && (
        <VencendoSemanaCard pagamentos={vencendoSemana} />
      )}

      {canViewPayments && riscoEvasao.length > 0 && (
        <RiscoEvasaoCard alunos={riscoEvasao} />
      )}

      <AniversariantesCard aniversariantes={aniversariantesMes} />

      {canViewPayments && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UltimosPagamentosCard pagamentos={ultimosPagamentos} />

          <MensalidadesAtrasoCard pagamentos={inadimplentes} />
        </div>
      )}
    </div>
  )
}