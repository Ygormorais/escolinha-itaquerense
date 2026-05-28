import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { getConfig } from "@/lib/config"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, ArrowLeft } from "lucide-react"
import { AgendarReuniao } from "@/components/responsavel/agendar-reuniao"
import Link from "next/link"

export default async function ReunioesPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const [reunioes, responsavel, config] = await Promise.all([
    db.evento.findMany({
      where: { tipo: "Reunião" },
      orderBy: { data: "desc" },
    }),
    db.responsavel.findUnique({
      where: { id: session.responsavelId },
      include: { alunos: { select: { id: true, nome: true } } },
    }),
    getConfig(),
  ])

  const calendarUrl = config.googleCalendarId
    ? `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(config.googleCalendarId)}&ctz=America/Sao_Paulo&wkst=1&hl=pt_BR`
    : null

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-[28px] border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(74,11,11,0.18)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
              <ArrowLeft className="size-4" />
              Voltar ao portal
            </Link>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Reuniões com Treinador
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Consulte encontros agendados, verifique horários disponíveis e solicite novas reuniões para acompanhar o desenvolvimento dos alunos.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Reuniões</p>
              <p className="mt-2 text-2xl font-bold">{reunioes.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Alunos</p>
              <p className="mt-2 text-2xl font-bold">{responsavel?.alunos.length ?? 0}</p>
            </div>
            <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Agenda</p>
              <p className="mt-2 text-2xl font-bold">{calendarUrl ? "Ativa" : "Manual"}</p>
            </div>
          </div>
        </div>
      </section>

      {reunioes.length === 0 && (
        <div className="py-12 text-center">
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
            <CardHeader className="border-b border-black/5 pb-4">
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

      {calendarUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="size-4" /> Agenda de Horários
            </CardTitle>
            <CardDescription>
              Consulte a disponibilidade e agende sua reunião
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-xl">
            <iframe
              src={calendarUrl}
              className="w-full h-[500px] border-0"
              title="Google Calendar"
            />
          </CardContent>
        </Card>
      )}

      <div className="max-w-md">
        <AgendarReuniao alunos={responsavel?.alunos ?? []} />
      </div>
    </div>
  )
}
