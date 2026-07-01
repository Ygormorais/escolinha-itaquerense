import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { TURMAS } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, AlertTriangle, Phone, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"

export const metadata = { title: "Fichas de Saúde — Painel do Técnico" }

export default async function TecnicoSaudePage() {
  await requireAuth()

  const alunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: {
      id: true,
      nome: true,
      turma: true,
      tipoSanguineo: true,
      alergias: true,
      condicaoSaude: true,
      contatoEmergenciaNome: true,
      contatoEmergenciaTel: true,
      contatoEmergenciaParentesco: true,
    },
    orderBy: [{ turma: "asc" }, { nome: "asc" }],
  })

  const porTurma = TURMAS.map((turma) => ({
    turma,
    alunos: alunos.filter((a) => a.turma === turma),
  })).filter((g) => g.alunos.length > 0)

  const comAlerta = alunos.filter((a) => a.alergias || a.condicaoSaude)
  const semFicha = alunos.filter(
    (a) => !a.tipoSanguineo && !a.alergias && !a.condicaoSaude && !a.contatoEmergenciaNome
  )

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div>
        <Link href="/tecnico" className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Painel do Técnico
        </Link>
        <PageHeader
          title="Fichas de Saúde"
          description="Informações médicas e contatos de emergência dos alunos"
        />
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-extrabold">{alunos.length}</p>
        </div>
        <div className="rounded-xl border bg-warning-50 border-warning-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-warning-700">Com Alerta</p>
          <p className="mt-1 text-2xl font-extrabold text-warning-800">{comAlerta.length}</p>
        </div>
        <div className="rounded-xl border bg-muted/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sem Ficha</p>
          <p className={`mt-1 text-2xl font-extrabold ${semFicha.length > 0 ? "text-muted-foreground" : "text-success-600"}`}>
            {semFicha.length}
          </p>
        </div>
      </div>

      {/* Por turma */}
      {porTurma.map(({ turma, alunos: lista }) => (
        <Card key={turma}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Heart className="size-4 text-danger-500" />
              {turma}
              <Badge variant="secondary" className="ml-auto">{lista.length} alunos</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {lista.map((a) => {
                const temAlerta = a.alergias || a.condicaoSaude
                const semInfo = !a.tipoSanguineo && !a.alergias && !a.condicaoSaude && !a.contatoEmergenciaNome
                return (
                  <div key={a.id} className={`px-6 py-4 ${temAlerta ? "bg-warning-50/40" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/alunos/${a.id}`} className="font-medium hover:underline text-sm">
                          {a.nome}
                        </Link>
                        {a.tipoSanguineo && (
                          <span className="rounded-full bg-danger-50 px-2 py-0.5 text-[10px] font-bold text-danger-700">
                            {a.tipoSanguineo}
                          </span>
                        )}
                        {temAlerta && <AlertTriangle className="size-3.5 text-warning-500" />}
                        {semInfo && <span className="text-[10px] text-muted-foreground italic">sem ficha</span>}
                      </div>

                      {a.contatoEmergenciaTel && (
                        <a
                          href={`tel:${a.contatoEmergenciaTel}`}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:underline shrink-0"
                        >
                          <Phone className="size-3" />
                          {a.contatoEmergenciaTel}
                        </a>
                      )}
                    </div>

                    {a.contatoEmergenciaNome && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Emergência: <span className="font-medium text-foreground">{a.contatoEmergenciaNome}</span>
                        {a.contatoEmergenciaParentesco && ` (${a.contatoEmergenciaParentesco})`}
                      </p>
                    )}

                    {a.alergias && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <AlertTriangle className="size-3 shrink-0 text-warning-600 mt-0.5" />
                        <p className="text-xs text-warning-800">
                          <strong>Alergias:</strong> {a.alergias}
                        </p>
                      </div>
                    )}

                    {a.condicaoSaude && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        <strong>Saúde:</strong> {a.condicaoSaude}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
