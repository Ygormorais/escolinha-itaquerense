"use client"

import { Calendar, Cake, Users, AlertTriangle, GraduationCap, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Evento = {
  id: number
  titulo: string
  tipo: string
  data: Date
  horaInicio: string | null
  horaFim: string | null
  local: string | null
  turmas: string | null
  descricao: string | null
}

type Aniversariante = {
  id: number
  nome: string
  dataNascimento: Date
  turma: string
}

const tipoStyles: Record<string, string> = {
  Treino: "bg-brand-100 text-brand-800",
  Jogo: "bg-success-50 text-success-600",
  Evento: "bg-info-50 text-info-600",
  Reunião: "bg-warning-50 text-warning-600",
}

export function SecretariaClient({
  eventosHoje,
  aniversariantes,
  matriculasMes,
  inadimplentes,
  alunosAtivos,
}: {
  eventosHoje: Evento[]
  aniversariantes: Aniversariante[]
  matriculasMes: number
  inadimplentes: number
  alunosAtivos: number
}) {
  const hoje = new Date()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-brand-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="size-3" /> Alunos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-heading tracking-tight">{alunosAtivos}</p>
            <Link href="/alunos" className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
              Ver todos <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <GraduationCap className="size-3" /> Matrículas no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-heading tracking-tight text-success-600">{matriculasMes}</p>
            <Link href="/alunos" className="mt-1 inline-flex items-center gap-1 text-xs text-success-600 hover:underline">
              Ver alunos <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-danger-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="size-3" /> Inadimplentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-heading tracking-tight text-danger-600">{inadimplentes}</p>
            <Link href="/inadimplencia" className="mt-1 inline-flex items-center gap-1 text-xs text-danger-600 hover:underline">
              Cobrar <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Cake className="size-3" /> Aniversariantes do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-heading tracking-tight text-warning-600">{aniversariantes.length}</p>
            {aniversariantes.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{aniversariantes[0]?.nome} hoje</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <Calendar className="size-4" /> Eventos de Hoje
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agenda">Ver agenda</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {eventosHoje.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum evento programado para hoje
              </p>
            ) : (
              <div className="space-y-3">
                {eventosHoje.map((ev) => (
                  <div key={ev.id} className={cn(
                    "rounded-lg border p-3",
                    tipoStyles[ev.tipo] ?? "bg-muted"
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{ev.titulo}</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">{ev.tipo}</Badge>
                          {ev.turmas && ev.turmas !== "Todas" && (
                            <span className="text-xs text-muted-foreground">{ev.turmas}</span>
                          )}
                          {ev.horaInicio && (
                            <span className="text-xs text-muted-foreground">{ev.horaInicio}{ev.horaFim ? ` — ${ev.horaFim}` : ""}</span>
                          )}
                          {ev.local && (
                            <span className="text-xs text-muted-foreground">{ev.local}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <Cake className="size-4" /> Aniversariantes
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {format(hoje, "MMMM", { locale: ptBR })}
            </span>
          </CardHeader>
          <CardContent>
            {aniversariantes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum aniversariante este mês
              </p>
            ) : (
              <div className="space-y-2">
                {aniversariantes.slice(0, 10).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-brand-800 text-xs font-bold">
                        {format(new Date(a.dataNascimento), "dd")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.nome}</p>
                        <p className="text-xs text-muted-foreground">{a.turma}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {new Date().getFullYear() - new Date(a.dataNascimento).getFullYear()} anos
                    </Badge>
                  </div>
                ))}
                {aniversariantes.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground">
                    +{aniversariantes.length - 10} aniversariante(s)
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
