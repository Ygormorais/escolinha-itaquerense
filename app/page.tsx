import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, TrendingUp, AlertCircle, CalendarCheck } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChartReceitaCustos } from "@/components/dashboard/chart-receita-custos"

export default async function DashboardPage() {
  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const inicioMes = startOfMonth(now)
  const fimMes = endOfMonth(now)

  const [
    totalAtivos,
    pagamentosMes,
    ultimosPagamentos,
    frequenciasMes,
    totalFrequencias,
    inadimplentes,
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
        dataVencimento: { lt: now },
      },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataVencimento: "asc" },
      take: 5,
    }),
  ])

  const sixMonthsAgo = subMonths(startOfMonth(now), 5)

  const [pagamentosChart, custosChart] = await Promise.all([
    db.pagamento.findMany({
      where: { dataPagamento: { gte: sixMonthsAgo } },
      select: { dataPagamento: true, valorRecebido: true },
    }),
    db.custo.findMany({
      where: { data: { gte: sixMonthsAgo } },
      select: { data: true, valor: true },
    }),
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

  const receitaMes = pagamentosMes.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
  const presencaMedia = totalFrequencias > 0
    ? Math.round((frequenciasMes / totalFrequencias) * 100)
    : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Dashboard"
        description={`Visão geral — ${format(now, "MMMM yyyy", { locale: ptBR })}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Alunos Ativos"
          value={totalAtivos}
          icon={Users}
          accent
        />
        <StatCard
          title="Receita do Mês"
          value={`R$ ${receitaMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          accent
        />
        <StatCard
          title="Inadimplentes"
          value={inadimplentes.length}
          description="Mensalidades vencidas"
          icon={AlertCircle}
        />
        <StatCard
          title="Presença Média"
          value={`${presencaMedia}%`}
          description="No mês atual"
          icon={CalendarCheck}
        />
      </div>

      <ChartReceitaCustos data={chartData} />

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
                    <TableCell className="text-red-600">
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
