import Link from "next/link"
import { AlertTriangle, CheckCircle, CreditCard, Plus, Users, XCircle } from "lucide-react"

import type { InscricaoCampeonato } from "@/components/campeonatos/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn, formatMoney } from "@/lib/utils"

type InscricoesSectionProps = {
  inscricoes: InscricaoCampeonato[]
  totalCustos: number
  podeInscrever: boolean
  onInscrever: () => void
  onPagar: (inscricao: InscricaoCampeonato, valorDevido: number) => void
  onRemover: (inscricaoId: number, alunoNome: string) => Promise<void>
}

function StatusInscricao({ inscricao }: { inscricao: InscricaoCampeonato }) {
  if (inscricao.bolsa) {
    return <Badge variant="outline" className="border-info-300 text-info-600">Isento</Badge>
  }
  if (inscricao.taxaPaga) {
    return <Badge variant="default" className="bg-success-600"><CheckCircle className="size-3" aria-hidden="true" /> Pago</Badge>
  }
  return <Badge variant="secondary" className="text-warning-600"><AlertTriangle className="size-3" aria-hidden="true" /> Pendente</Badge>
}

export function InscricoesSection({
  inscricoes,
  totalCustos,
  podeInscrever,
  onInscrever,
  onPagar,
  onRemover,
}: InscricoesSectionProps) {
  return (
    <Card data-slot="inscricoes-section" className="min-w-0 border-border/80 shadow-sm">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-brand-800" aria-hidden="true" /> Alunos Inscritos
        </CardTitle>
        <Button onClick={onInscrever} disabled={!podeInscrever}>
          <Plus className="size-4" aria-hidden="true" /> Inscrever
        </Button>
      </CardHeader>

      {inscricoes.length === 0 ? (
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Users className="size-8 text-muted-foreground/30" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Nenhum aluno inscrito neste campeonato</p>
          </div>
        </CardContent>
      ) : (
        <>
          <CardContent className="divide-y divide-border p-0 xl:hidden">
            {inscricoes.map((inscricao) => {
              const valorDevido = Math.max(0, totalCustos - inscricao.desconto)
              return (
                <article key={inscricao.id} className="grid min-w-0 gap-4 p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/alunos/${inscricao.aluno.id}`} className="whitespace-normal [overflow-wrap:anywhere] font-semibold text-brand-800 hover:underline">
                        {inscricao.aluno.nome}
                      </Link>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{inscricao.aluno.responsavel} · {inscricao.aluno.telefone}</p>
                    </div>
                    <StatusInscricao inscricao={inscricao} />
                  </div>

                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Turma</dt><dd className="mt-1 font-medium">{inscricao.aluno.turma}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Valor devido</dt><dd data-numeric className={cn("mt-1 font-medium", inscricao.bolsa && "text-muted-foreground line-through")}>{inscricao.bolsa ? "R$ 0,00" : formatMoney(valorDevido)}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Desconto</dt><dd data-numeric className={inscricao.desconto > 0 ? "mt-1 font-medium text-success-600" : "mt-1 text-muted-foreground"}>{inscricao.desconto > 0 ? `- ${formatMoney(inscricao.desconto)}` : "—"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Bolsa</dt><dd className="mt-1">{inscricao.bolsa ? "Bolsa Integral" : "Não"}</dd></div>
                  </dl>

                  <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
                    {!inscricao.bolsa && !inscricao.taxaPaga && (
                      <Button variant="outline" onClick={() => onPagar(inscricao, valorDevido)}>
                        <CreditCard className="size-4" aria-hidden="true" /> Pagar
                      </Button>
                    )}
                    <ConfirmDialog title="Remover inscrição?" description={`Remover ${inscricao.aluno.nome} do campeonato?`} confirmLabel="Remover" onConfirm={() => onRemover(inscricao.id, inscricao.aluno.nome)}>
                      <Button size="icon" variant="ghost" aria-label="Remover inscrição">
                        <XCircle className="size-4 text-danger-600" aria-hidden="true" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                </article>
              )
            })}
          </CardContent>

          <CardContent className="hidden p-0 xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Bolsa</TableHead>
                  <TableHead>Valor Devido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscricoes.map((inscricao) => {
                  const valorDevido = Math.max(0, totalCustos - inscricao.desconto)
                  return (
                    <TableRow key={inscricao.id} className="transition-colors hover:bg-muted/30">
                      <TableCell>
                        <Link href={`/alunos/${inscricao.aluno.id}`} className="font-medium text-brand-800 hover:underline">{inscricao.aluno.nome}</Link>
                        <p className="text-xs text-muted-foreground">{inscricao.aluno.responsavel} · {inscricao.aluno.telefone}</p>
                      </TableCell>
                      <TableCell>{inscricao.aluno.turma}</TableCell>
                      <TableCell>{inscricao.desconto > 0 ? <span className="font-medium text-success-600">- {formatMoney(inscricao.desconto)}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{inscricao.bolsa ? <span className="flex items-center gap-1 text-xs font-medium text-info-600"><CheckCircle className="size-3" aria-hidden="true" /> Bolsa Integral</span> : <span className="text-muted-foreground">Não</span>}</TableCell>
                      <TableCell data-numeric className={cn("font-medium", inscricao.bolsa && "text-muted-foreground line-through")}>{inscricao.bolsa ? "R$ 0,00" : formatMoney(valorDevido)}</TableCell>
                      <TableCell><StatusInscricao inscricao={inscricao} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {!inscricao.bolsa && !inscricao.taxaPaga && (
                            <Button size="sm" variant="outline" onClick={() => onPagar(inscricao, valorDevido)}><CreditCard className="size-3" aria-hidden="true" /> Pagar</Button>
                          )}
                          <ConfirmDialog title="Remover inscrição?" description={`Remover ${inscricao.aluno.nome} do campeonato?`} confirmLabel="Remover" onConfirm={() => onRemover(inscricao.id, inscricao.aluno.nome)}>
                            <Button size="icon-sm" variant="ghost" aria-label="Remover inscrição"><XCircle className="size-4 text-danger-600" aria-hidden="true" /></Button>
                          </ConfirmDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </>
      )}
    </Card>
  )
}
