import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, CreditCard, Shirt } from "lucide-react"

export default async function DesempenhoPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        include: {
          frequencias: { orderBy: { data: "desc" }, take: 20 },
          pagamentos: { orderBy: { dataVencimento: "desc" }, take: 6 },
          uniformes: true,
          inscricoes: { include: { campeonato: true } },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Desempenho dos Atletas</h1>
      <div className="space-y-6">
        {responsavel.alunos.map((aluno) => {
          const presentes = aluno.frequencias.filter((f) => f.presenca === "presente").length
          const totalFreq = aluno.frequencias.length
          const perc = totalFreq > 0 ? Math.round((presentes / totalFreq) * 100) : 0

          return (
            <Card key={aluno.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {aluno.nome}
                  <Badge variant="secondary" className="text-[10px]">{aluno.turma}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <CalendarCheck className="size-4" />
                      Frequência
                    </div>
                    <p className="text-2xl font-bold">{perc}%</p>
                    <p className="text-xs text-muted-foreground">{presentes}/{totalFreq} presenças</p>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          perc >= 75 ? "bg-success-600" : perc >= 50 ? "bg-warning-600" : "bg-destructive"
                        }`}
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <CreditCard className="size-4" />
                      Pagamentos
                    </div>
                    <p className="text-2xl font-bold">
                      {aluno.pagamentos.filter((p) => p.dataPagamento).length}/{aluno.pagamentos.length}
                    </p>
                    <p className="text-xs text-muted-foreground">últimos meses</p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Shirt className="size-4" />
                      Uniforme
                    </div>
                    <p className="text-2xl font-bold">
                      {aluno.uniformes.filter((u) => u.entregue).length}/{aluno.uniformes.length}
                    </p>
                    <p className="text-xs text-muted-foreground">itens entregues</p>
                  </div>
                </div>

                {aluno.inscricoes.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Campeonatos</p>
                    <div className="flex flex-wrap gap-2">
                      {aluno.inscricoes.map((insc) => (
                        <Badge key={insc.id} variant="secondary">
                          {insc.campeonato.nome}
                          {insc.bolsa && " (Bolsa)"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
