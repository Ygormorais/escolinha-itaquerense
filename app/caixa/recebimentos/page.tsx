import { db } from "@/lib/db"
import { formatMoney } from "@/lib/utils"
import { Inbox } from "lucide-react"
import { getPaymentChannel } from "@/lib/payment-channel"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MonthPicker } from "@/app/caixa/month-picker"
import Link from "next/link"

export const metadata = { title: "Recebimentos — Escolinha Itaquerense" }

export default async function RecebimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const sp = await searchParams
  const now = new Date()
  const mesParam = sp.mes ?? format(now, "yyyy-MM")
  const [ano, mes] = mesParam.split("-").map(Number)
  const ref = new Date(ano, mes - 1, 1)
  const inicio = startOfMonth(ref)
  const fim = endOfMonth(ref)

  const pagamentos = await db.pagamento.findMany({
    where: { dataPagamento: { gte: inicio, lte: fim } },
    include: { aluno: { select: { id: true, nome: true, turma: true } } },
    orderBy: { dataPagamento: "desc" },
  })

  const total = pagamentos.reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
  const labelMes = format(ref, "MMMM 'de' yyyy", { locale: ptBR })
  const porCanal = pagamentos.reduce<Record<string, { total: number; quantidade: number }>>((acc, pagamento) => {
    const canal = getPaymentChannel(pagamento.formaPagamento)
    const atual = acc[canal] ?? { total: 0, quantidade: 0 }
    atual.total += pagamento.valorRecebido ?? 0
    atual.quantidade += 1
    acc[canal] = atual
    return acc
  }, {})
  const canaisOrdenados = Object.entries(porCanal).sort((a, b) => b[1].total - a[1].total)

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Recebimentos"
        description={`${pagamentos.length} recebimentos · Total: ${formatMoney(total)} · ${labelMes}`}
        action={<MonthPicker mes={mesParam} basePath="/caixa/recebimentos" />}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total recebido</p>
            <p className="mt-1 font-heading text-2xl font-bold text-success-600">{formatMoney(total)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{pagamentos.length} recebimento(s) no mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Canal lider</p>
            <p className="mt-1 font-heading text-2xl font-bold">
              {canaisOrdenados[0]?.[0] ?? "Sem dados"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {canaisOrdenados[0] ? `${formatMoney(canaisOrdenados[0][1].total)} no periodo` : "Nenhum recebimento ainda"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Distribuicao</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {canaisOrdenados.length === 0 && <span className="text-xs text-muted-foreground">Sem canais registrados.</span>}
              {canaisOrdenados.map(([canal, dados]) => (
                <Badge key={canal} variant="outline" className="text-xs">
                  {canal}: {dados.quantidade}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Mês Ref.</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagamentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Inbox className="size-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Nenhum recebimento em {labelMes}.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {pagamentos.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                </TableCell>
                <TableCell>{p.aluno.turma}</TableCell>
                <TableCell>{p.mesReferencia}</TableCell>
                <TableCell>{formatMoney(p.valorRecebido ?? 0)}</TableCell>
                <TableCell>{getPaymentChannel(p.formaPagamento)}</TableCell>
                <TableCell>{p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
