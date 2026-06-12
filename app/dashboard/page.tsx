import { db } from "@/lib/db"
import { formatMoney, plural } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, TrendingUp, AlertCircle, CalendarCheck, Inbox, CheckCircle2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import dynamic from "next/dynamic"
import { MonthPicker } from "@/app/caixa/month-picker"
import { GerarMesButton } from "@/components/dashboard/gerar-mes-button"
import { getConfig } from "@/lib/config"
import { TURMAS } from "@/lib/constants"
import { AlertBanner, type AlertIcon } from "@/components/dashboard/alert-banner"
import { EmptyState } from "@/components/ui/empty-state"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ResumoFinanceiro } from "@/components/dashboard/resumo-financeiro"
import { AniversariantesCard } from "@/components/dashboard/aniversariantes-card"
import { aniversariantesDoMes } from "@/lib/aniversariantes"

const ChartReceitaCustos = dynamic(() => import("@/components/dashboard/chart-receita-custos").then(m => ({ default: m.ChartReceitaCustos })), { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> })
const ChartInadimplencia = dynamic(() => import("@/components/dashboard/chart-inadimplencia").then(m => ({ default: m.ChartInadimplencia })), { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> })
const ChartReceitaPorTurma = dynamic(() => import("@/components/dashboard/chart-receita-turma").then(m => ({ default: m.ChartReceitaPorTurma })), { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> })

export const metadata = { title: "Dashboard — Escolinha Itaquerense" }

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mesSelecionado = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [anoRef, mesRef] = mesSelecionado.split("-").map(Number)
  const dataRef = new Date(anoRef, mesRef - 1, 1)
  const mesAtual = mesSelecionado
  const inicioMes = startOfMonth(dataRef)
  const fimMes = endOfMonth(dataRef)

  const sixMonthsAgo = subMonths(startOfMonth(dataRef), 5)

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(dataRef, 5 - i)
    return format(d, "yyyy-MM")
  })

  const config = getConfig()

  const [
    totalAtivos,
    pagamentosMes,
    ultimosPagamentos,
    frequenciasMes,
    totalFrequencias,
    inadimplentes,
    pagamentosChart,
    custosChart,
    aniversariantes,
    vencendoSemana,
    ocupacaoTurmas,
    todosPagamentos6Meses,
    receitaTurmaRaw,
    mesAnteriorData,
    mesAnteriorCustos,
    mensalidadesVencidas,
    alunosInadimplentes,
  ] = await Promise.all([
    db.aluno.count({ where: { status: "Ativo" } }),
    db.pagamento.findMany({
      where: { mesReferencia: mesAtual, dataPagamento: { not: null } },
    }),
    db.pagamento.findMany({
      where: { dataPagamento: { not: null } },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataPagamento: "desc" },
      take: 5,
    }),
    db.frequencia.count({
      where: { data: { gte: inicioMes, lte: fimMes }, presenca: "Presente" },
    }),
    db.frequencia.count({
      where: { data: { gte: inicioMes, lte: fimMes } },
    }),
    db.pagamento.findMany({
      where: {
        mesReferencia: mesAtual,
        dataPagamento: null,
        dataVencimento: { lt: fimMes },
      },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataVencimento: "asc" },
      take: 5,
    }),
    db.pagamento.findMany({
      where: { dataPagamento: { gte: sixMonthsAgo } },
      select: { dataPagamento: true, valorRecebido: true },
    }),
    db.custo.findMany({
      where: { data: { gte: sixMonthsAgo } },
      select: { data: true, valor: true },
    }),
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { id: true, nome: true, dataNascimento: true },
      orderBy: { dataNascimento: "asc" },
    }),
    db.pagamento.findMany({
      where: {
        dataPagamento: null,
        dataVencimento: { gte: inicioMes, lte: addDays(fimMes, 7) },
      },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataVencimento: "asc" },
    }),
    Promise.all(
      TURMAS.map(async (turma) => {
        const count = await db.aluno.count({ where: { turma, status: "Ativo" } })
        return { turma, count }
      })
    ),
    db.pagamento.findMany({
      where: { mesReferencia: { in: last6Months } },
      select: { mesReferencia: true, dataPagamento: true, valorRecebido: true },
    }),
    db.pagamento.findMany({
      where: { mesReferencia: mesAtual, dataPagamento: { not: null } },
      select: { valorRecebido: true, aluno: { select: { turma: true } } },
    }),
    // Previous month data for comparison
    (() => {
      const mesAnteriorObj = subMonths(dataRef, 1)
      const mesAnteriorStr = format(mesAnteriorObj, "yyyy-MM")
      return db.pagamento.aggregate({
        where: { mesReferencia: mesAnteriorStr, dataPagamento: { not: null } },
        _sum: { valorRecebido: true },
      }).then(r => ({ mes: mesAnteriorStr, receita: r._sum.valorRecebido ?? 0 }))
    })(),
    (() => {
      const mesAnteriorObj = subMonths(dataRef, 1)
      const inicio = startOfMonth(mesAnteriorObj)
      const fim = endOfMonth(mesAnteriorObj)
      return db.custo.aggregate({
        where: { data: { gte: inicio, lte: fim } },
        _sum: { valor: true },
      }).then(r => ({ custos: r._sum.valor ?? 0 }))
    })(),
    // Contagens sem take — mesmos critérios da página /inadimplencia
    db.pagamento.count({
      where: { dataPagamento: null, dataVencimento: { lt: now }, aluno: { status: "Ativo" } },
    }),
    db.pagamento.findMany({
      where: { dataPagamento: null, dataVencimento: { lt: now }, aluno: { status: "Ativo" } },
      select: { alunoId: true },
      distinct: ["alunoId"],
    }).then((rows) => rows.length),
  ])

  const chartData = last6Months.map((mes) => {
    const recebido = pagamentosChart
      .filter((p) => p.dataPagamento && format(p.dataPagamento, "yyyy-MM") === mes)
      .reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
    const custos = custosChart
      .filter((c) => format(c.data, "yyyy-MM") === mes)
      .reduce((s, c) => s + c.valor, 0)
    const [year, month] = mes.split("-")
    const label = format(new Date(Number(year), Number(month) - 1), "MMM/yy", { locale: ptBR })
    return { mes: label, recebido, custos }
  })

  const inadimplenciaData = last6Months.map((mes) => {
    const registros = todosPagamentos6Meses.filter((p) => p.mesReferencia === mes)
    const pagas = registros.filter((p) => p.dataPagamento).length
    const vencidas = registros.length - pagas
    const total = registros.length
    const [year, month] = mes.split("-")
    const label = format(new Date(Number(year), Number(month) - 1), "MMM/yy", { locale: ptBR })
    return { mes: label, pagas, vencidas, taxa: total > 0 ? Math.round((vencidas / total) * 100) : 0 }
  })

  const receitaTurmaData = TURMAS.map((turma) => {
    const receita = receitaTurmaRaw
      .filter((p) => p.aluno.turma === turma)
      .reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
    const alunos = receitaTurmaRaw.filter((p) => p.aluno.turma === turma).length
    return { turma, receita, alunos }
  }).filter((t) => t.alunos > 0)

  const aniversariantesMes = aniversariantesDoMes(aniversariantes, dataRef, now)

  const receitaMes = pagamentosMes.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
  const custosMes = custosChart
    .filter((c) => format(c.data, "yyyy-MM") === mesAtual)
    .reduce((s, c) => s + c.valor, 0)
  const presencaMedia = totalFrequencias > 0
    ? Math.round((frequenciasMes / totalFrequencias) * 100)
    : 0

  const alerts: { type: "danger" | "warning" | "info"; icon: AlertIcon; message: string; detail: string }[] = []
  if (mensalidadesVencidas > 5) {
    alerts.push({ type: "danger", icon: "alerta", message: `${mensalidadesVencidas} mensalidades em atraso`, detail: "Regularize os pagamentos pendentes para evitar acumulação." })
  }
  if (mensalidadesVencidas > 0 && mensalidadesVencidas <= 5) {
    alerts.push({ type: "warning", icon: "alerta", message: `${plural(mensalidadesVencidas, "mensalidade", "mensalidades", "nenhuma")} em atraso`, detail: "Poucos casos, mas requer atenção." })
  }
  if (presencaMedia < 50 && totalFrequencias > 0) {
    alerts.push({ type: "danger", icon: "frequencia", message: "Presença média baixa", detail: `Apenas ${presencaMedia}% no mês atual.` })
  }
  if (presencaMedia >= 50 && presencaMedia < 75 && totalFrequencias > 0) {
    alerts.push({ type: "warning", icon: "frequencia", message: "Presença média moderada", detail: `${presencaMedia}% no mês atual.` })
  }
  if (vencendoSemana.length > 0) {
    alerts.push({ type: "info", icon: "tendencia", message: `${plural(vencendoSemana.length, "mensalidade vence", "mensalidades vencem", "nenhuma")} nos próximos 7 dias`, detail: "Lembrar de cobrar antes do vencimento." })
  }

  const receitaAnterior = mesAnteriorData.receita
  const custosAnterior = mesAnteriorCustos.custos

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Dashboard"
        description={`Visão geral — ${format(dataRef, "MMMM yyyy", { locale: ptBR })}`}
        action={
            <div className="flex items-center gap-2">
              <GerarMesButton mes={mesAtual} />
              <MonthPicker mes={mesSelecionado} basePath="/" />
            </div>
          }
      />

      {alerts.length > 0 && <AlertBanner alerts={alerts} />}

      <QuickActions />

      <ResumoFinanceiro
        receita={receitaMes}
        custos={custosMes}
        saldo={receitaMes - custosMes}
        mesAnterior={receitaAnterior > 0 || custosAnterior > 0 ? {
          receita: receitaAnterior,
          custos: custosAnterior,
        } : undefined}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard
          title="Alunos Ativos"
          value={totalAtivos}
          icon={Users}
          variant="brand"
          borderAccent
          href="/alunos"
        />
        <StatCard
          title="Receita do Mês"
          value={`R$ ${receitaMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          variant={config.metaMensal > 0 && receitaMes >= config.metaMensal ? "success" : "brand"}
          borderAccent
          href="/caixa"
          progress={config.metaMensal > 0 ? {
            value: receitaMes,
            max: config.metaMensal,
            label: `de R$ ${config.metaMensal.toLocaleString("pt-BR")}`,
          } : undefined}
        />
        <StatCard
          title="Inadimplentes"
          value={alunosInadimplentes}
          description="Alunos com mensalidade vencida"
          icon={AlertCircle}
          variant={alunosInadimplentes > 0 ? "danger" : "success"}
          href="/inadimplencia"
        />
        <StatCard
          title="Presença Média"
          value={totalFrequencias > 0 ? `${presencaMedia}%` : "—"}
          description={totalFrequencias > 0 ? "No mês atual" : "Sem registros no mês"}
          icon={CalendarCheck}
          variant={totalFrequencias === 0 ? "default" : presencaMedia >= 75 ? "success" : presencaMedia >= 50 ? "warning" : "danger"}
          href="/frequencia"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartReceitaCustos data={chartData} />
        <ChartInadimplencia data={inadimplenciaData} />
      </div>

      <ChartReceitaPorTurma data={receitaTurmaData} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-brand-800" />
            Ocupação das Turmas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {ocupacaoTurmas.map(({ turma, count }) => {
              const pct = config.capacidadeTurma > 0
                ? Math.min(100, Math.round((count / config.capacidadeTurma) * 100))
                : 0
              const barColor =
                pct >= 90 ? "bg-danger-600" :
                pct >= 70 ? "bg-warning-600" :
                "bg-success-600"
              return (
                <div key={turma} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{turma}</span>
                    <span className="text-xs text-muted-foreground">{count}/{config.capacidadeTurma}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{pct}% ocupado</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {vencendoSemana.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning-600">
              <AlertCircle className="size-4" />
              Mensalidades vencendo nos próximos 7 dias ({vencendoSemana.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vencendoSemana.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                    <TableCell>{p.aluno.turma}</TableCell>
                    <TableCell className="text-warning-600 font-medium">
                      {format(p.dataVencimento, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{p.mesReferencia}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AniversariantesCard aniversariantes={aniversariantesMes} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ultimosPagamentos.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Nenhum pagamento registrado"
                description="Os pagamentos confirmados aparecerão aqui."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ultimosPagamentos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                      <TableCell>{p.aluno.turma}</TableCell>
                      <TableCell>{p.dataPagamento ? format(p.dataPagamento, "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(p.valorRecebido ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensalidades em Atraso</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {inadimplentes.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Nenhuma mensalidade em atraso"
                description="Tudo em dia neste mês."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inadimplentes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                      <TableCell>{p.aluno.turma}</TableCell>
                      <TableCell className="text-danger-600">
                        {format(p.dataVencimento, "dd/MM/yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
