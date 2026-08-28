import { db } from "@/lib/db"
import { Banknote } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { mergeRecebimentosDinheiro } from "@/lib/caixa/dinheiro"
import { formatMoney, plural } from "@/lib/utils"
import { RegistrarDinheiroDialog } from "./registrar-dinheiro-dialog"

export const metadata = { title: "Dinheiro — Escolinha Itaquerense" }

export default async function DinheiroPage() {
  const now = new Date()
  const inicio = startOfMonth(now)
  const fim = endOfMonth(now)

  const [pagamentos, recebimentos, alunos] = await Promise.all([
    db.pagamento.findMany({
      where: { formaPagamento: "Dinheiro", dataPagamento: { gte: inicio, lte: fim } },
      select: {
        valorRecebido: true,
        dataPagamento: true,
        mesReferencia: true,
        aluno: { select: { nome: true, turma: true } },
      },
    }),
    db.recebimento.findMany({
      where: { formaPagamento: "Dinheiro", data: { gte: inicio, lte: fim } },
    }),
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
  ])

  const entradas = mergeRecebimentosDinheiro(pagamentos, recebimentos)
  const total = entradas.reduce((s, e) => s + e.valor, 0)

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Dinheiro"
        description={`${plural(entradas.length, "entrada", "entradas", "nenhuma")} no mês · ${formatMoney(total)}`}
        action={<RegistrarDinheiroDialog alunos={alunos} />}
      />

      <div className="grid gap-3 md:hidden">
        {entradas.map((e, i) => <article key={i} className="rounded-xl border bg-card p-4"><div className="flex justify-between gap-3"><div><h3 className="font-semibold">{e.origem}</h3><p className="mt-1 text-sm text-muted-foreground">{e.detalhe}</p></div><strong>{formatMoney(e.valor)}</strong></div><div className="mt-3 flex items-center justify-between border-t pt-3 text-sm"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.tipo === "Mensalidade" ? "bg-info-50 text-info-600" : "bg-success-50 text-success-600"}`}>{e.tipo}</span><span className="text-muted-foreground">{format(new Date(e.data), "dd/MM/yyyy")}</span></div></article>)}
      </div>
      <div className="hidden rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead>Detalhe</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Banknote className="size-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Nenhuma entrada em dinheiro neste mês</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {entradas.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{e.origem}</TableCell>
                <TableCell className="text-muted-foreground">{e.detalhe}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${e.tipo === "Mensalidade" ? "bg-info-50 text-info-600" : "bg-success-50 text-success-600"}`}>
                    {e.tipo}
                  </span>
                </TableCell>
                <TableCell>{format(new Date(e.data), "dd/MM/yyyy")}</TableCell>
                <TableCell className="text-right font-medium">{formatMoney(e.valor)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
