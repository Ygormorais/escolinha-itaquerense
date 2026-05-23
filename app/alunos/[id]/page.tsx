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
import { PagamentoButton } from "./pagamento-button"
import { EditarAlunoButton } from "./editar-button"
import { FrequenciaChart } from "./frequencia-chart"

const statusPagStyle: Record<string, string> = {
  "Pago": "bg-success-50 text-success-600",
  "Pendente": "bg-gray-100 text-gray-600",
  "Em atraso": "bg-warning-50 text-warning-600",
  "Atraso grave": "bg-danger-50 text-danger-600",
}

const presencaStyle: Record<string, string> = {
  Presente: "bg-success-50 text-success-600",
  Ausente: "bg-danger-50 text-danger-600",
  Justificado: "bg-warning-50 text-warning-600",
}

export default async function AlunoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numId = Number(id)
  if (!Number.isInteger(numId)) notFound()
  const aluno = await db.aluno.findUnique({
    where: { id: numId },
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
            <div className="flex items-center gap-2">
              <Badge
                className={
                  aluno.status === "Ativo"
                    ? "bg-success-50 text-success-600"
                    : "bg-danger-50 text-danger-600"
                }
              >
                {aluno.status}
              </Badge>
              <EditarAlunoButton aluno={aluno} />
            </div>
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
            {aluno.observacoes && (
              <div className="pt-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observações</span>
                <p className="mt-1 text-sm text-foreground">{aluno.observacoes}</p>
              </div>
            )}
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

      <FrequenciaChart alunoId={aluno.id} />

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
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {aluno.pagamentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    <TableCell>
                      {!p.dataPagamento && (
                        <PagamentoButton pagamentoId={p.id} mensalidade={aluno.mensalidade} />
                      )}
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
