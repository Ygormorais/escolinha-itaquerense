import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import { AgendarReuniao } from "@/components/responsavel/agendar-reuniao"

export default async function ReunioesPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const [reunioes, responsavel] = await Promise.all([
    db.evento.findMany({
      where: { tipo: "Reunião" },
      orderBy: { data: "desc" },
    }),
    db.responsavel.findUnique({
      where: { id: session.responsavelId },
      include: { alunos: { select: { id: true, nome: true } } },
    }),
  ])

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Reuniões com Treinador</h1>

      {reunioes.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="size-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma reunião agendada no momento.</p>
          <p className="text-xs text-muted-foreground mt-1">
            As reuniões serão exibidas aqui quando agendadas pela secretaria.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reunioes.map((r) => (
          <Card key={r.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{r.titulo}</CardTitle>
                <Badge variant="secondary">{r.tipo}</Badge>
              </div>
              <CardDescription>
                {format(new Date(r.data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              {(r.horaInicio || r.horaFim) && (
                <p className="flex items-center gap-2">
                  <Clock className="size-3.5" />
                  {r.horaInicio}{r.horaFim ? ` — ${r.horaFim}` : ""}
                </p>
              )}
              {r.local && (
                <p className="flex items-center gap-2">
                  <MapPin className="size-3.5" />
                  {r.local}
                </p>
              )}
              {r.descricao && <p className="text-xs mt-2">{r.descricao}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 max-w-md">
        <AgendarReuniao alunos={responsavel?.alunos ?? []} />
      </div>
    </>
  )
}
