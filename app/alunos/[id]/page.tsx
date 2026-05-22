import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { calcStatus, formatMoney, formatDate } from "@/lib/utils"

const statusPagStyle: Record<string, string> = {
  "Pago": "bg-green-100 text-green-800",
  "Pendente": "bg-gray-100 text-gray-600",
  "Em atraso": "bg-yellow-100 text-yellow-800",
  "Atraso grave": "bg-red-100 text-red-800",
}

const presencaStyle: Record<string, string> = {
  Presente: "bg-green-100 text-green-800",
  Ausente: "bg-red-100 text-red-800",
  Justificado: "bg-yellow-100 text-yellow-800",
}

export default async function AlunoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const aluno = await db.aluno.findUnique({
    where: { id: Number(id) },
    include: {
      pagamentos: { orderBy: { dataVencimento: "desc" } },
      frequencias: { orderBy: { data: "desc" }, take: 30 },
    },
  })

  if (!aluno) notFound()

  const totalPago = aluno.pagamentos
    .filter((p) => p.dataPagamento)
    .reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
  const pendentes = aluno.pagamentos.filter((p) => !p.dataPagamento).length

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Link
          href="/alunos"
          className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar para Alunos
        </Link>
        <PageHeader
          title={aluno.nome}
          description={`${aluno.turma} · ${aluno.horario}`}
          action={
            <Badge
              className={
                aluno.status === "Ativo"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {aluno.status}
            </Badge>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Responsável", aluno.responsavel],
              ["Telefone", aluno.telefone],
              ["Email", aluno.email],
              ["Nascimento", formatDate(aluno.dataNascimento)],
              ["Matrícula", formatDate(aluno.dataMatricula)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-muted pb-2 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Mensalidade", formatMoney(aluno.mensalidade)],
              ["Total Pago", formatMoney(totalPago)],
              ["Pendências", `${pendentes} mês(es)`],
              ["Total Registros", String(aluno.pagamentos.length)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-muted pb-2 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pago em</TableHead>
                <TableHead>Forma</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluno.pagamentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum registro de pagamento
                  </TableCell>
                </TableRow>
              )}
              {aluno.pagamentos.map((p) => {
                const status = calcStatus(p.dataVencimento, p.dataPagamento)
                return (
                  <TableRow key={p.id}>
                    <TableCell>{p.mesReferencia}</TableCell>
                    <TableCell>{formatDate(p.dataVencimento)}</TableCell>
                    <TableCell>{p.dataPagamento ? formatDate(p.dataPagamento) : "—"}</TableCell>
                    <TableCell>{p.formaPagamento ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      {p.valorRecebido ? formatMoney(p.valorRecebido) : formatMoney(aluno.mensalidade)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusPagStyle[status] ?? ""}`}
                      >
                        {status}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Frequência (últimos 30 registros)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Presença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluno.frequencias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Nenhum registro de frequência
                  </TableCell>
                </TableRow>
              )}
              {aluno.frequencias.map((f) => (
                <TableRow key={f.id}>
                  <TableCell>{format(f.data, "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${presencaStyle[f.presenca] ?? ""}`}
                    >
                      {f.presenca}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
