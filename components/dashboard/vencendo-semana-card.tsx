import Link from "next/link"
import { format } from "date-fns"
import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PagamentoVencendo = {
  id: number
  dataVencimento: Date
  mesReferencia: string
  aluno: { id: number; nome: string; turma: string }
}

export function VencendoSemanaCard({ pagamentos: vencendoSemana }: { pagamentos: PagamentoVencendo[] }) {
  return (
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
                <TableCell className="font-medium">
                  <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                </TableCell>
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
  )
}
