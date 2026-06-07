import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MonthPicker } from "@/app/caixa/month-picker"

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
    include: { aluno: { select: { nome: true, turma: true } } },
    orderBy: { dataPagamento: "desc" },
  })

  const total = pagamentos.reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
  const labelMes = format(ref, "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Recebimentos"
        description={`${pagamentos.length} recebimentos · Total: R$ ${total.toFixed(2)} · ${labelMes}`}
        action={<MonthPicker mes={mesParam} basePath="/caixa/recebimentos" />}
      />

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Mês Ref.</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagamentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum recebimento em {labelMes}.
                </TableCell>
              </TableRow>
            )}
            {pagamentos.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                <TableCell>{p.aluno.turma}</TableCell>
                <TableCell>{p.mesReferencia}</TableCell>
                <TableCell>R$ {(p.valorRecebido ?? 0).toFixed(2)}</TableCell>
                <TableCell>{p.formaPagamento || "—"}</TableCell>
                <TableCell>{p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
