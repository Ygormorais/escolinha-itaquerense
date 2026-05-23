import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, TrendingUp, AlertCircle, CalendarCheck, Cake, TrendingDown } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChartReceitaCustos } from "@/components/dashboard/chart-receita-custos"
import { MonthPicker } from "@/app/caixa/month-picker"
import { GerarMesButton } from "@/components/dashboard/gerar-mes-button"
import { getConfig } from "@/lib/config"
import { TURMAS } from "@/lib/constants"

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
      select: { id: true, nome: true, dataNascimento: true, turma: true },
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
  ])

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i)
    return format(d, "yyyy-MM")
  })

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

  const aniversariantesMes = aniversariantes.filter(
    (a) => new Date(a.dataNascimento).getMonth() + 1 === mesRef
  ).sort((a, b) => new Date(a.dataNascimento).getDate() - new Date(b.dataNascimento).getDate())

  const receitaMes = pagamentosMes.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
  const presencaMedia = totalFrequencias > 0
    ? Math.round((frequenciasMes / totalFrequencias) * 100)
    : 0

  return (
    <div className="flex flex-col gap-6 p-6">
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          value={inadimplentes.length}
          description="Mensalidades vencidas"
          icon={AlertCircle}
          variant={inadimplentes.length > 0 ? "danger" : "success"}
          href="/inadimplencia"
        />
        <StatCard
          title="Presença Média"
          value={`${presencaMedia}%`}
          description="No mês atual"
          icon={CalendarCheck}
          variant={presencaMedia >= 75 ? "success" : presencaMedia >= 50 ? "warning" : "danger"}
          href="/frequencia"
        />
      </div>

      <ChartReceitaCustos data={chartData} />

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

      {aniversariantesMes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="size-4 text-brand-800" />
              Aniversariantes de {format(now, "MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Idade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aniversariantesMes.map((a) => {
                  const nasc = new Date(a.dataNascimento)
                  const idade = now.getFullYear() - nasc.getFullYear()
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell>{a.turma}</TableCell>
                      <TableCell>{format(nasc, "dd/MM")}</TableCell>
                      <TableCell>{idade} anos</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
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
                {ultimosPagamentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum pagamento registrado
                    </TableCell>
                  </TableRow>
                )}
                {ultimosPagamentos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                    <TableCell>{p.aluno.turma}</TableCell>
                    <TableCell>{p.dataPagamento ? format(p.dataPagamento, "dd/MM/yyyy") : "-"}</TableCell>
                    <TableCell className="text-right">
                      R$ {(p.valorRecebido ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensalidades em Atraso</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inadimplentes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhuma mensalidade em atraso
                    </TableCell>
                  </TableRow>
                )}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
