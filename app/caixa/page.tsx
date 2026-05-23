import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react"
import { startOfMonth, endOfMonth } from "date-fns"
import { MonthPicker } from "./month-picker"
import { ExportarCaixaButton } from "./exportar-button"

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes =
    params.mes ??
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [ano, mesNum] = mes.split("-").map(Number)
  const dataRef = new Date(ano, mesNum - 1, 1)
  const inicio = startOfMonth(dataRef)
  const fim = endOfMonth(dataRef)

  const [alunosAtivos, pagamentosPagos, custosDoMes] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo" }, select: { mensalidade: true } }),
    db.pagamento.findMany({
      where: {
        dataPagamento: { gte: inicio, lte: fim },
        valorRecebido: { not: null },
      },
      include: { aluno: { select: { nome: true } } },
    }),
    db.custo.findMany({
      where: { data: { gte: inicio, lte: fim } },
    }),
  ])

  const receitaPrevista = alunosAtivos.reduce((sum, a) => sum + a.mensalidade, 0)
  const totalRecebido = pagamentosPagos.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
  const totalCustos = custosDoMes.reduce((sum, c) => sum + c.valor, 0)
  const saldo = totalRecebido - totalCustos

  // Group by forma de pagamento
  const porForma = new Map<string, number>()
  for (const p of pagamentosPagos) {
    const forma = p.formaPagamento ?? "Não informado"
    porForma.set(forma, (porForma.get(forma) ?? 0) + (p.valorRecebido ?? 0))
  }

  // Group by categoria
  const porCategoria = new Map<string, number>()
  for (const c of custosDoMes) {
    porCategoria.set(c.categoria, (porCategoria.get(c.categoria) ?? 0) + c.valor)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Caixa"
        description={`Fluxo financeiro — ${mes}`}
        action={
          <div className="flex gap-2">
            <ExportarCaixaButton mes={mes} pagamentos={pagamentosPagos} custos={custosDoMes} />
            <MonthPicker mes={mes} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Receita Prevista"
          value={`R$ ${receitaPrevista.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          description="Soma das mensalidades ativas"
          icon={DollarSign}
          accent
        />
        <StatCard
          title="Total Recebido"
          value={`R$ ${totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          description="Pagamentos confirmados no mês"
          icon={TrendingUp}
          accent
        />
        <StatCard
          title="Total Custos"
          value={`R$ ${totalCustos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          description="Despesas do mês"
          icon={TrendingDown}
        />
        <StatCard
          title="Saldo"
          value={`R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          description="Recebido menos custos"
          icon={Wallet}
          accent={saldo >= 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Forma de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Forma</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porForma.size === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Nenhum pagamento no período
                    </TableCell>
                  </TableRow>
                )}
                {Array.from(porForma.entries()).map(([forma, valor]) => (
                  <TableRow key={forma}>
                    <TableCell className="font-medium">{forma}</TableCell>
                    <TableCell className="text-right">
                      R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custos por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porCategoria.size === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Nenhum custo no período
                    </TableCell>
                  </TableRow>
                )}
                {Array.from(porCategoria.entries()).map(([cat, valor]) => (
                  <TableRow key={cat}>
                    <TableCell className="font-medium">{cat}</TableCell>
                    <TableCell className="text-right">
                      R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
