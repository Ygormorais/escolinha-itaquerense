import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

export const metadata = { title: "Boleto — Escolinha Itaquerense" }

export default async function BoletoPage() {
  const pagamentosBoleto = await db.pagamento.findMany({
    where: { formaPagamento: "Boleto", dataPagamento: { not: null } },
    include: { aluno: { select: { nome: true, turma: true } } },
    orderBy: { dataPagamento: "desc" },
    take: 100,
  })

  const total = pagamentosBoleto.reduce((s, p) => s + (p.valorRecebido ?? 0), 0)

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Pagamentos via Boleto"
        description={`${pagamentosBoleto.length} recebimentos · Total: R$ ${total.toFixed(2)}`}
      />

      <div className="rounded-xl border bg-card">
        {pagamentosBoleto.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum pagamento via boleto registrado ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Mês Ref.</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagamentosBoleto.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                  <TableCell>{p.aluno.turma}</TableCell>
                  <TableCell>{p.mesReferencia}</TableCell>
                  <TableCell>R$ {(p.valorRecebido ?? 0).toFixed(2)}</TableCell>
                  <TableCell>{p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
