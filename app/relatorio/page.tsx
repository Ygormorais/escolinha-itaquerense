import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { formatMoney } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { TrendingUp, TrendingDown, Wallet, AlertCircle, BarChart2 } from "lucide-react"
import { format, startOfYear, endOfYear } from "date-fns"
import { ptBR } from "date-fns/locale"
import dynamic from "next/dynamic"
import { RelatorioHeader, RelatorioPrintStyle } from "./relatorio-client"

const RelatorioChart = dynamic(
  () => import("./relatorio-client").then((m) => ({ default: m.RelatorioChart })),
  { loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> }
)
import { RelatorioNav } from "@/components/relatorio/relatorio-nav"

export const metadata = { title: "Relatório Financeiro — Escolinha Itaquerense" }

export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>
}) {
  const { role } = await requireAuth(["admin"])
  const params = await searchParams
  const now = new Date()
  const ano = Number(params.ano ?? now.getFullYear())

  const inicioAno = startOfYear(new Date(ano, 0, 1))
  const fimAno = endOfYear(new Date(ano, 0, 1))

  const [pagamentos, custos, inadimplentesTotal] = await Promise.all([
    db.pagamento.findMany({
      where: { dataPagamento: { gte: inicioAno, lte: fimAno } },
      select: { dataPagamento: true, valorRecebido: true },
    }),
    db.custo.findMany({
      where: { data: { gte: inicioAno, lte: fimAno } },
      select: { data: true, valor: true, categoria: true },
    }),
    db.pagamento.findMany({
      where: { dataPagamento: null, dataVencimento: { lt: now }, aluno: { status: "Ativo" } },
      select: { alunoId: true },
      distinct: ["alunoId"],
    }).then((rows) => rows.length),
  ])

  const totaisPorMes = Array.from({ length: 12 }, () => ({ receita: 0, custo: 0 }))
  for (const pagamento of pagamentos) {
    totaisPorMes[pagamento.dataPagamento!.getMonth()].receita += pagamento.valorRecebido ?? 0
  }
  for (const custo of custos) {
    totaisPorMes[custo.data.getMonth()].custo += custo.valor
  }

  // Agrupa em uma única passagem pelos dados do ano.
  const meses = Array.from({ length: 12 }, (_, i) => {
    const dataRef = new Date(ano, i, 1)
    const label = format(dataRef, "MMM/yy", { locale: ptBR })
    const { receita, custo } = totaisPorMes[i]

    return { mes: i + 1, label, receita, custo, saldo: receita - custo }
  })

  const totalReceita = meses.reduce((s, m) => s + m.receita, 0)
  const totalCustos = meses.reduce((s, m) => s + m.custo, 0)
  const totalSaldo = totalReceita - totalCustos

  // Custos por categoria no ano
  const porCategoria = new Map<string, number>()
  for (const c of custos) {
    porCategoria.set(c.categoria, (porCategoria.get(c.categoria) ?? 0) + c.valor)
  }
  const categorias = Array.from(porCategoria.entries())
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="relatorio-print flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <RelatorioPrintStyle />
      <RelatorioNav role={role as "admin"} />
      <PageHeader
        title="Relatório Anual"
        description={`Resumo financeiro consolidado — ${ano}`}
        action={<div className="no-print"><RelatorioHeader ano={ano} meses={meses} /></div>}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Receita Total"
          value={formatMoney(totalReceita)}
          description={`Ano ${ano}`}
          icon={TrendingUp}
          variant="brand"
        />
        <StatCard
          title="Custos Totais"
          value={formatMoney(totalCustos)}
          description={`Ano ${ano}`}
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          title="Saldo do Ano"
          value={formatMoney(totalSaldo)}
          description="Receita menos custos"
          icon={Wallet}
          variant={totalSaldo >= 0 ? "success" : "danger"}
        />
        <StatCard
          title="Inadimplentes Atuais"
          value={inadimplentesTotal}
          description="Mensalidades vencidas"
          icon={AlertCircle}
        />
      </div>

      <RelatorioChart meses={meses} ano={ano} categorias={categorias} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalhamento Mensal</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Custos</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meses.map((m) => (
                  <TableRow key={m.mes}>
                    <TableCell className="font-medium capitalize">{m.label}</TableCell>
                    <TableCell className="text-right text-success-600">
                      {m.receita > 0 ? formatMoney(m.receita) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-danger-600">
                      {m.custo > 0 ? formatMoney(m.custo) : "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        m.saldo > 0 ? "text-success-600" : m.saldo < 0 ? "text-danger-600" : "text-muted-foreground"
                      }`}
                    >
                      {m.receita === 0 && m.custo === 0 ? "—" : formatMoney(m.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right text-success-600">
                    {formatMoney(totalReceita)}
                  </TableCell>
                  <TableCell className="text-right text-danger-600">
                    {formatMoney(totalCustos)}
                  </TableCell>
                  <TableCell
                    className={`text-right ${totalSaldo >= 0 ? "text-success-600" : "text-danger-600"}`}
                  >
                    {formatMoney(totalSaldo)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2}>
                      <div className="flex flex-col items-center gap-2 py-8 text-center">
                        <BarChart2 className="size-7 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Sem custos no ano</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {categorias.map(([cat, valor]) => (
                  <TableRow key={cat}>
                    <TableCell className="font-medium">{cat}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(valor)}
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
