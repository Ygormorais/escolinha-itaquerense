import { db } from "@/lib/db"
import { formatMoney } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Descontos — Escolinha Itaquerense" }

export default async function DescontosPage() {
  const alunosComDesconto = await db.aluno.findMany({
    where: { desconto: { gt: 0 }, status: "Ativo" },
    select: { id: true, nome: true, turma: true, mensalidade: true, desconto: true },
    orderBy: { desconto: "desc" },
  })

  const totalDescontos = alunosComDesconto.reduce((s, a) => s + a.desconto, 0)
  const totalMensalidades = alunosComDesconto.reduce((s, a) => s + a.mensalidade, 0)

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Descontos"
        description="Alunos com desconto na mensalidade"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alunos com Desconto</p>
          <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-warning-600">{alunosComDesconto.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Descontos</p>
          <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-danger-600">{formatMoney(totalDescontos)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">% Média Desconto</p>
          <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-foreground">
            {totalMensalidades > 0 ? ((totalDescontos / totalMensalidades) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>% Desconto</TableHead>
              <TableHead>Valor Pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunosComDesconto.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum aluno com desconto cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              alunosComDesconto.map((a) => {
                const pct = (a.desconto / a.mensalidade) * 100
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell>{a.turma}</TableCell>
                    <TableCell>{formatMoney(a.mensalidade)}</TableCell>
                    <TableCell className="text-danger-600 font-medium">— {formatMoney(a.desconto)}</TableCell>
                    <TableCell>
                      <Badge variant={pct > 50 ? "destructive" : pct > 25 ? "outline" : "secondary"}>
                        {pct.toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{formatMoney(a.mensalidade - a.desconto)}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
