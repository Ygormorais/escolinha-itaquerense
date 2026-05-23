import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Phone, MessageCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { TURMAS } from "@/lib/constants"
import { getConfig } from "@/lib/config"

export default async function TurmasPage() {
  const config = getConfig()

  const alunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: {
      id: true,
      nome: true,
      turma: true,
      horario: true,
      telefone: true,
      responsavel: true,
      mensalidade: true,
      pagamentos: {
        where: { dataPagamento: null, dataVencimento: { lt: new Date() } },
        select: { id: true },
      },
    },
    orderBy: { nome: "asc" },
  })

  const turmasData = TURMAS.map((turma) => {
    const membros = alunos.filter((a) => a.turma === turma)
    const totalInadimplentes = membros.filter((a) => a.pagamentos.length > 0).length
    const receitaMensal = membros.reduce((s, a) => s + a.mensalidade, 0)
    const pct = config.capacidadeTurma > 0
      ? Math.min(100, Math.round((membros.length / config.capacidadeTurma) * 100))
      : 0
    return { turma, membros, totalInadimplentes, receitaMensal, pct }
  })

  const totalAtivos = alunos.length

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Turmas"
        description={`${totalAtivos} aluno(s) ativo(s) distribuídos em ${TURMAS.length} turmas`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {turmasData.map(({ turma, membros, totalInadimplentes, receitaMensal, pct }) => (
          <Card key={turma} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{turma}</CardTitle>
                <div className="flex items-center gap-2">
                  {totalInadimplentes > 0 && (
                    <Badge className="bg-danger-50 text-danger-600 text-xs">
                      {totalInadimplentes} inadimplente(s)
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {membros.length}/{config.capacidadeTurma}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 90 ? "bg-danger-600" : pct >= 70 ? "bg-warning-600" : "bg-success-600"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{pct}% ocupado</span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="size-3" />
                  R$ {receitaMensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {membros.length === 0 ? (
                <p className="px-6 py-4 text-sm text-muted-foreground">Nenhum aluno nesta turma</p>
              ) : (
                <div className="divide-y divide-muted">
                  {membros.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-6 py-2.5">
                      <div className="min-w-0">
                        <Link
                          href={`/alunos/${a.id}`}
                          className="text-sm font-medium hover:text-brand-800 hover:underline truncate block"
                        >
                          {a.nome}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">{a.horario}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {a.pagamentos.length > 0 && (
                          <Badge className="bg-danger-50 text-danger-600 text-xs px-1.5 py-0">
                            atrasado
                          </Badge>
                        )}
                        {a.telefone && (
                          <a
                            href={`https://wa.me/55${a.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${a.responsavel?.split(" ")[0] ?? ""}! 👋`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center size-6 rounded text-success-600 hover:bg-success-50 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="size-3.5" />
                          </a>
                        )}
                        <a
                          href={`tel:${a.telefone}`}
                          className="inline-flex items-center justify-center size-6 rounded text-brand-800 hover:bg-brand-50 transition-colors"
                          title="Ligar"
                        >
                          <Phone className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
