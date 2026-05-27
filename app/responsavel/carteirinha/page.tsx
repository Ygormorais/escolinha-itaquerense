import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function CarteirinhaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        include: {
          uniformes: true,
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const alunos = responsavel.alunos

  if (alunos.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold">Carteirinhas</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum aluno vinculado à sua conta.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Carteirinhas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Carteirinha digital dos alunos vinculados
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {alunos.map((aluno) => {
          const nascimento = format(new Date(aluno.dataNascimento), "dd/MM/yyyy", { locale: ptBR })
          const matricula = String(aluno.id).padStart(6, "0")
          const uniformesEntregues = aluno.uniformes.filter((u) => u.entregue)

          return (
            <Card key={aluno.id} className="overflow-hidden border-0 shadow-lg">
              {/* Header brand */}
              <div
                className="relative flex items-center gap-3 px-5 py-4"
                style={{ background: "linear-gradient(135deg, #C62828 0%, #e53935 100%)" }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" />
                    <path d="M12 2 C7 5 5 10 12 12 C19 14 17 19 12 22" stroke="white" strokeWidth="1.2" fill="none" />
                    <path d="M2 12 C5 7 10 5 12 12 C14 19 19 17 22 12" stroke="white" strokeWidth="1.2" fill="none" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white leading-tight truncate">
                    Escolinha Itaquerense
                  </p>
                  <p className="text-[10px] text-white/70 tracking-wider">
                    CARTEIRINHA DIGITAL
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] text-white/50 uppercase tracking-wider">Matrícula</p>
                  <p className="font-bold text-xs text-white font-mono tracking-wider">
                    {matricula}
                  </p>
                </div>
              </div>

              <CardContent className="p-0">
                {/* Photo + Info row */}
                <div className="flex gap-4 p-5 pb-3">
                  {/* Photo */}
                  <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    {aluno.foto ? (
                      <img
                        src={aluno.foto}
                        alt={aluno.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4.5" stroke="#9ca3af" strokeWidth="1.5" />
                        <path d="M4 20c0-4.5 3.6-8 8-8s8 3.5 8 8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-center gap-1.5 min-w-0">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nome</p>
                      <p className="font-bold text-sm text-foreground leading-tight truncate">
                        {aluno.nome}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nascimento</p>
                        <p className="text-xs font-semibold text-foreground">{nascimento}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Turma</p>
                        <p className="text-xs font-semibold text-foreground">{aluno.turma}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Responsável</p>
                      <p className="text-xs font-semibold text-foreground truncate">{aluno.responsavel}</p>
                    </div>
                  </div>
                </div>

                {/* Uniform info */}
                {uniformesEntregues.length > 0 && (
                  <div className="border-t px-5 py-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                      Uniforme
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {uniformesEntregues.map((u) => (
                        <Badge key={u.id} variant="secondary" className="text-[10px]">
                          {u.item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer badge */}
                <div className="flex items-center justify-between border-t bg-muted/30 px-5 py-2.5">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Emissão</p>
                      <p className="text-[10px] font-semibold">
                        {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Validade</p>
                      <p className="text-[10px] font-semibold">
                        {format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), "MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-brand-800/20 text-brand-800 text-[9px] tracking-wider"
                  >
                    DIGITAL
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
