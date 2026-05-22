import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, DollarSign, Phone } from "lucide-react"
import { format, differenceInDays } from "date-fns"

export default async function InadimplenciaPage() {
  const now = new Date()

  const pagamentosVencidos = await db.pagamento.findMany({
    where: {
      dataPagamento: null,
      dataVencimento: { lt: now },
    },
    include: {
      aluno: {
        select: { nome: true, turma: true, telefone: true, mensalidade: true },
      },
    },
    orderBy: { dataVencimento: "asc" },
  })

  // Group by aluno
  const porAluno = new Map<
    number,
    {
      alunoId: number
      nome: string
      turma: string
      telefone: string
      mensalidade: number
      pagamentos: typeof pagamentosVencidos
    }
  >()

  for (const p of pagamentosVencidos) {
    if (!porAluno.has(p.alunoId)) {
      porAluno.set(p.alunoId, {
        alunoId: p.alunoId,
        nome: p.aluno.nome,
        turma: p.aluno.turma,
        telefone: p.aluno.telefone,
        mensalidade: p.aluno.mensalidade,
        pagamentos: [],
      })
    }
    porAluno.get(p.alunoId)!.pagamentos.push(p)
  }

  const inadimplentes = Array.from(porAluno.values())

  const totalInadimplentes = inadimplentes.length
  const valorTotalAberto = inadimplentes.reduce(
    (sum, a) => sum + a.mensalidade * a.pagamentos.length,
    0
  )
  const mesesMedios =
    totalInadimplentes > 0
      ? Math.round(
          inadimplentes.reduce((sum, a) => sum + a.pagamentos.length, 0) /
            totalInadimplentes
        )
      : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Inadimplência"
        description="Mensalidades vencidas e não pagas"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          title="Total Inadimplentes"
          value={totalInadimplentes}
          description="Alunos com mensalidade vencida"
          icon={AlertTriangle}
        />
        <StatCard
          title="Valor Total em Aberto"
          value={`R$ ${valorTotalAberto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          description="Soma das mensalidades em atraso"
          icon={DollarSign}
        />
        <StatCard
          title="Meses Médios de Atraso"
          value={mesesMedios}
          description="Média por aluno inadimplente"
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alunos Inadimplentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="text-center">Meses em Aberto</TableHead>
                <TableHead className="text-right">Valor em Aberto</TableHead>
                <TableHead>Vencimento Mais Antigo</TableHead>
                <TableHead>Nível</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inadimplentes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum aluno inadimplente
                  </TableCell>
                </TableRow>
              )}
              {inadimplentes.map((a) => {
                const maisAntigo = a.pagamentos.at(0)?.dataVencimento ?? new Date()
                const diasAtraso = differenceInDays(now, maisAntigo)
                const isCritico = diasAtraso > 30
                const valorAberto = a.mensalidade * a.pagamentos.length

                return (
                  <TableRow key={a.alunoId}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell>{a.turma}</TableCell>
                    <TableCell>
                      <a
                        href={`tel:${a.telefone}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-800 hover:underline"
                      >
                        <Phone className="size-3" />
                        {a.telefone}
                      </a>
                    </TableCell>
                    <TableCell className="text-center">{a.pagamentos.length}</TableCell>
                    <TableCell className="text-right">
                      R$ {valorAberto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {format(maisAntigo, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {isCritico ? (
                        <Badge variant="destructive" className="inline-flex items-center gap-1">
                          <AlertTriangle className="size-3" /> Crítico
                        </Badge>
                      ) : (
                        <Badge className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="size-3" /> Atenção
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
