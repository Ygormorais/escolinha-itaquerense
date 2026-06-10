import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { mergeRecebimentosDinheiro } from "@/lib/caixa/dinheiro"
import { formatMoney } from "@/lib/utils"
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
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Dinheiro"
        description={`${entradas.length} entrada(s) no mês · ${formatMoney(total)}`}
        action={<RegistrarDinheiroDialog alunos={alunos} />}
      />

      <div className="rounded-xl border border-border bg-card">
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
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhuma entrada em dinheiro neste mês
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
