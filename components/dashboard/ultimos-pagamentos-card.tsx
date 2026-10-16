import Link from "next/link"
import { format } from "date-fns"
import { CheckCircle2, Inbox } from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Aluno = { id: number; nome: string; turma: string }

export function UltimosPagamentosCard({
  pagamentos: ultimosPagamentos,
}: {
  pagamentos: { id: number; dataPagamento: Date | null; valorRecebido: number | null; aluno: Aluno }[]
}) {
  return (
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
                <TableCell className="font-medium">
                  <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                </TableCell>
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
  )
}

export function MensalidadesAtrasoCard({
  pagamentos: inadimplentes,
}: {
  pagamentos: { id: number; dataVencimento: Date; aluno: Aluno }[]
}) {
  return (
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
                <TableCell className="font-medium">
                  <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                </TableCell>
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
  )
}
