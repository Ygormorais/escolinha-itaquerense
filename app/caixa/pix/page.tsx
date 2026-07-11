import { db } from "@/lib/db"
import { formatMoney } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { differenceInDays, format } from "date-fns"
import Link from "next/link"
import { QrCode, Inbox } from "lucide-react"

export const metadata = { title: "PIX — Escolinha Itaquerense" }

export default async function PixPage() {
  const [emitidos, recebidos] = await Promise.all([
    db.pagamento.findMany({
      where: { canalPrevisto: "PIX", statusCobranca: "pendente" },
      include: { aluno: { select: { id: true, nome: true, turma: true } } },
      orderBy: { dataVencimento: "asc" },
      take: 200,
    }),
    db.pagamento.findMany({
      where: { dataPagamento: { not: null }, formaPagamento: "PIX" },
      include: { aluno: { select: { id: true, nome: true, turma: true } } },
      orderBy: { dataPagamento: "desc" },
      take: 100,
    }),
  ])

  const totalRecebido = recebidos.reduce((s, p) => s + (p.valorRecebido ?? 0), 0)
  const proximoVencimento = emitidos[0]?.dataVencimento ?? null
  const diasParaVencer = proximoVencimento ? differenceInDays(new Date(proximoVencimento), new Date()) : null

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="PIX"
        description={`${recebidos.length} recebidos · ${formatMoney(totalRecebido)}`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aguardando pagamento</p>
            <p className="mt-1 font-heading text-2xl font-bold text-warning-600">{emitidos.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Cobrancas PIX pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recebido via PIX</p>
            <p className="mt-1 font-heading text-2xl font-bold text-success-600">{formatMoney(totalRecebido)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{recebidos.length} baixa(s) confirmadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proximo vencimento</p>
            <p className="mt-1 font-heading text-2xl font-bold">{proximoVencimento ? format(new Date(proximoVencimento), "dd/MM") : "—"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {diasParaVencer === null ? "Nenhuma cobranca emitida" : diasParaVencer < 0 ? "Ja vencido" : `${diasParaVencer} dia(s) para vencer`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="emitidos">
        <TabsList>
          <TabsTrigger value="emitidos">Emitidos ({emitidos.length})</TabsTrigger>
          <TabsTrigger value="recebidos">Recebidos ({recebidos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="emitidos">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">PIX</Badge>
            Cobrancas aguardando pagamento no app ou via copia e cola.
          </div>
          <div className="rounded-xl border bg-card overflow-x-auto">
            {emitidos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <QrCode className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhuma cobrança PIX aguardando pagamento.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Mês Ref.</TableHead>
                    <TableHead>Vencimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emitidos.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                      </TableCell>
                      <TableCell>{p.aluno.turma}</TableCell>
                      <TableCell>{p.mesReferencia}</TableCell>
                      <TableCell>{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
        <TabsContent value="recebidos">
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Recebidos</Badge>
            Historico recente de pagamentos efetivamente baixados como PIX.
          </div>
          <div className="rounded-xl border bg-card overflow-x-auto">
            {recebidos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Inbox className="size-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhum recebimento via PIX ainda.</p>
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
                  {recebidos.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                      </TableCell>
                      <TableCell>{p.aluno.turma}</TableCell>
                      <TableCell>{p.mesReferencia}</TableCell>
                      <TableCell>{formatMoney(p.valorRecebido ?? 0)}</TableCell>
                      <TableCell>{p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
