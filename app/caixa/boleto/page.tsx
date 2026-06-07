import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

export const metadata = { title: "Boleto — Escolinha Itaquerense" }

export default async function BoletoPage() {
  const [emitidos, recebidos] = await Promise.all([
    db.pagamento.findMany({
      where: { canalPrevisto: "Boleto", statusCobranca: "pendente" },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataVencimento: "asc" },
    }),
    db.pagamento.findMany({
      where: { dataPagamento: { not: null }, formaPagamento: "Boleto" },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataPagamento: "desc" },
      take: 100,
    }),
  ])

  const totalRecebido = recebidos.reduce((s, p) => s + (p.valorRecebido ?? 0), 0)

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader title="Boleto" description={`${recebidos.length} recebidos · R$ ${totalRecebido.toFixed(2)}`} />
      <Tabs defaultValue="emitidos">
        <TabsList>
          <TabsTrigger value="emitidos">Emitidos ({emitidos.length})</TabsTrigger>
          <TabsTrigger value="recebidos">Recebidos ({recebidos.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="emitidos">
          <div className="rounded-xl border bg-card overflow-x-auto">
            {emitidos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum boleto aguardando pagamento.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Mês Ref.</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Linha Digitável</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emitidos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                      <TableCell>{p.aluno.turma}</TableCell>
                      <TableCell>{p.mesReferencia}</TableCell>
                      <TableCell>{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-mono text-xs">{p.linhaDigitavel ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
        <TabsContent value="recebidos">
          <div className="rounded-xl border bg-card overflow-x-auto">
            {recebidos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Nenhum boleto recebido ainda.</div>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
