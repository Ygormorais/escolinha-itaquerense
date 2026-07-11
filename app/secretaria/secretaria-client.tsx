"use client"

import {
  Calendar, Cake, Users, AlertTriangle, GraduationCap, ArrowRight,
  CheckCircle2, ClipboardList, CreditCard, Clock, ImageOff, Phone, Mail, ChevronRight, FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { cn, plural, formatMoney } from "@/lib/utils"
import type { RscDate } from "@/lib/rsc-date"
import { toast } from "sonner"

type Evento = {
  id: number; titulo: string; tipo: string; data: RscDate
  horaInicio: string | null; horaFim: string | null; local: string | null
  turmas: string | null; descricao: string | null
}

type Aniversariante = {
  id: number; nome: string; dataNascimento: RscDate; turma: string; telefone: string | null
}

type PagamentoHoje = {
  id: number; mesReferencia: string; valorRecebido: number | null
  formaPagamento: string | null; dataPagamento: RscDate | null
  aluno: { nome: string; turma: string }
}

type PreMatricula = {
  id: number; nomeAluno: string; turma: string; horario: string
  nomeResponsavel: string; telefone: string; createdAt: RscDate; status: string
}

type PendenciaDoc = {
  id: number; nome: string; turma: string
  foto: string | null; telefone: string; email: string
}

const tipoStyles: Record<string, string> = {
  Treino: "bg-brand-50 text-brand-800 dark:bg-brand-950/40 dark:text-brand-100",
  Jogo: "bg-success-50 text-success-600 dark:bg-success-600/15 dark:text-success-50",
  Evento: "bg-info-50 text-info-600 dark:bg-info-600/15 dark:text-info-50",
  "Reunião": "bg-warning-50 text-warning-600 dark:bg-warning-600/15 dark:text-warning-50",
}

function AniversarianteRow({ a }: { a: Aniversariante }) {
  const nasc = new Date(a.dataNascimento)
  const hoje = new Date()
  const anos = hoje.getFullYear() - nasc.getFullYear()
  const eHoje = nasc.getDate() === hoje.getDate() && nasc.getMonth() === hoje.getMonth()
  const tel = a.telefone?.replace(/\D/g, "") ?? ""
  function enviarParabens() {
    if (!tel) { toast.error("Aluno sem telefone cadastrado"); return }
    const msg = `Parabéns, ${a.nome.split(" ")[0]}! Hoje você completa ${anos} anos! Desejamos muita saúde, alegria e gols pela frente. Abraços da equipe da Escolinha Itaquerense.`
    const numero = tel.startsWith("55") ? tel : `55${tel}`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer")
  }
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-2.5",
        eHoje && "border-brand-200 bg-brand-50/60 dark:border-brand-800 dark:bg-brand-950/30",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-full text-xs font-bold",
            eHoje
              ? "bg-brand-600 text-white"
              : "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100",
          )}
        >
          {format(nasc, "dd")}
        </div>
        <div>
          <p className="text-sm font-medium">
            {a.nome}
            {eHoje && (
              <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-brand-600">
                hoje
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{a.turma}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">{anos} anos</Badge>
        {tel && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs text-success-600 hover:text-success-600"
            onClick={enviarParabens}
          >
            <Cake className="size-3.5" />
            Parabéns
          </Button>
        )}
      </div>
    </div>
  )
}

export function SecretariaClient({
  eventosHoje, proximoEvento, aniversariantes,
  matriculasMes, inadimplentes, alunosAtivos,
  pagamentosHoje, preMatriculasPendentes, pendenciasDoc,
}: {
  eventosHoje: Evento[]
  proximoEvento: Evento | null
  aniversariantes: Aniversariante[]
  matriculasMes: number
  inadimplentes: number
  alunosAtivos: number
  pagamentosHoje: PagamentoHoje[]
  preMatriculasPendentes: PreMatricula[]
  pendenciasDoc: PendenciaDoc[]
}) {
  const hoje = new Date()

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
            {(() => {
              const hojeNiver = aniversariantes.filter((a) => {
                const d = new Date(a.dataNascimento)
                return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth()
              })
              if (hojeNiver.length === 0) {
                return (
                  <p className="mt-1 text-xs text-muted-foreground">
                    no mês de {format(hoje, "MMMM", { locale: ptBR })}
                  </p>
                )
              }
              return (
                <p className="mt-1 text-xs font-medium text-brand-600">
                  {hojeNiver.length === 1
                    ? `${hojeNiver[0].nome.split(" ")[0]} faz aniversário hoje`
                    : `${hojeNiver.length} fazem aniversário hoje`}
                </p>
              )
            })()}
          </CardContent>
        </Card>
      </div>


      {/* Linha 1: Eventos hoje + Próximo evento */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <Calendar className="size-4" /> Eventos de Hoje
            </CardTitle>
            <Link href="/agenda">
              <Button variant="ghost" size="sm" className="text-xs">Ver agenda</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {eventosHoje.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center text-muted-foreground">
                <Calendar className="size-8 opacity-30" />
                <p className="text-sm">Nenhum evento hoje</p>
              </div>
            ) : (
              <div className="space-y-2">
                {eventosHoje.map((ev) => (
                  <div key={ev.id} className={cn("rounded-lg border p-3", tipoStyles[ev.tipo] ?? "bg-muted")}>
                    <p className="text-sm font-semibold">{ev.titulo}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-[10px]">{ev.tipo}</Badge>
                      {ev.horaInicio && <span className="text-xs opacity-80">{ev.horaInicio}{ev.horaFim ? ` — ${ev.horaFim}` : ""}</span>}
                      {ev.local && <span className="text-xs opacity-80">{ev.local}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <Clock className="size-4" /> Próximo Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!proximoEvento ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center text-muted-foreground">
                <Clock className="size-8 opacity-30" />
                <p className="text-sm">Nenhum evento agendado</p>
              </div>
            ) : (
              <div className={cn("rounded-xl border p-4 space-y-2", tipoStyles[proximoEvento.tipo] ?? "bg-muted")}>
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{proximoEvento.titulo}</p>
                  <Badge variant="outline" className="text-[10px] shrink-0">{proximoEvento.tipo}</Badge>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(proximoEvento.data), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  {proximoEvento.horaInicio && ` às ${proximoEvento.horaInicio}`}
                </p>
                <p className="text-xs opacity-75">
                  {formatDistanceToNow(new Date(proximoEvento.data), { locale: ptBR, addSuffix: true })}
                  {proximoEvento.local && ` · ${proximoEvento.local}`}
                </p>
                {proximoEvento.turmas && proximoEvento.turmas !== "Todas" && (
                  <p className="text-xs opacity-75">Turmas: {proximoEvento.turmas}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: Pagamentos hoje + Pré-matrículas pendentes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <CheckCircle2 className="size-4 text-success-600" /> Pagamentos de Hoje
            </CardTitle>
            <span className="text-xs font-semibold text-success-600">
              {pagamentosHoje.length > 0 && formatMoney(pagamentosHoje.reduce((s, p) => s + (p.valorRecebido ?? 0), 0))}
            </span>
          </CardHeader>
          <CardContent>
            {pagamentosHoje.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center text-muted-foreground">
                <CreditCard className="size-8 opacity-30" />
                <p className="text-sm">Nenhum pagamento registrado hoje</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pagamentosHoje.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border bg-success-50/40 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{p.aluno.nome}</p>
                      <p className="text-xs text-muted-foreground">{p.mesReferencia} · {p.formaPagamento}</p>
                    </div>
                    <span className="text-sm font-semibold text-success-700">
                      {formatMoney(p.valorRecebido ?? 0)}
                    </span>
                  </div>
                ))}
                {pagamentosHoje.length > 8 && (
                  <Link href="/pagamentos" className="block pt-1 text-center text-xs text-muted-foreground hover:text-foreground">
                    +{pagamentosHoje.length - 8} pagamentos — ver todos
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <ClipboardList className="size-4 text-warning-600" /> Pré-matrículas Pendentes
            </CardTitle>
            {preMatriculasPendentes.length > 0 && (
              <Badge className="bg-warning-100 text-warning-700 hover:bg-warning-100">
                {preMatriculasPendentes.length}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {preMatriculasPendentes.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center text-muted-foreground">
                <ClipboardList className="size-8 opacity-30" />
                <p className="text-sm">Nenhuma pré-matrícula pendente</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {preMatriculasPendentes.slice(0, 6).map((pm) => (
                  <Link key={pm.id} href="/pre-matriculas">
                    <div className="flex items-center justify-between rounded-lg border bg-warning-50/40 px-3 py-2 hover:bg-warning-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{pm.nomeAluno}</p>
                        <p className="text-xs text-muted-foreground">
                          {pm.turma} · {pm.nomeResponsavel}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(pm.createdAt), { locale: ptBR, addSuffix: true })}
                        </span>
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
                {preMatriculasPendentes.length > 6 && (
                  <Link href="/pre-matriculas" className="block pt-1 text-center text-xs text-muted-foreground hover:text-foreground">
                    +{preMatriculasPendentes.length - 6} pendentes — ver todas
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: Pendências de documentação + Aniversariantes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <FileText className="size-4 text-danger-600" /> Pendências de Cadastro
            </CardTitle>
            {pendenciasDoc.length > 0 && (
              <Badge className="bg-danger-100 text-danger-700 hover:bg-danger-100">
                {pendenciasDoc.length} alunos
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {pendenciasDoc.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center text-muted-foreground">
                <CheckCircle2 className="size-8 text-success-500 opacity-70" />
                <p className="text-sm">Todos os cadastros completos</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {pendenciasDoc.slice(0, 6).map((a) => (
                  <Link key={a.id} href={`/alunos/${a.id}`}>
                    <div className="flex items-center justify-between rounded-lg border px-3 py-2 hover:bg-muted/40 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{a.nome}</p>
                        <p className="text-xs text-muted-foreground">{a.turma}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!a.foto && (
                          <span title="Sem foto" className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            <ImageOff className="size-3" /> foto
                          </span>
                        )}
                        {!a.telefone && (
                          <span title="Sem telefone" className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            <Phone className="size-3" /> tel
                          </span>
                        )}
                        {!a.email && (
                          <span title="Sem e-mail" className="flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            <Mail className="size-3" /> email
                          </span>
                        )}
                        <ChevronRight className="size-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
                {pendenciasDoc.length > 6 && (
                  <Link href="/alunos" className="block pt-1 text-center text-xs text-muted-foreground hover:text-foreground">
                    +{pendenciasDoc.length - 6} alunos com pendências
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <Cake className="size-4" /> Aniversariantes
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {format(hoje, "MMMM", { locale: ptBR })}
            </span>
          </CardHeader>
          <CardContent>
            {aniversariantes.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-6 text-center text-muted-foreground">
                <Cake className="size-8 opacity-30" />
                <p className="text-sm">Nenhum aniversariante este mês</p>
              </div>
            ) : (
              <div className="space-y-2">
                {aniversariantes.slice(0, 8).map((a) => (
                  <AniversarianteRow key={a.id} a={a} />
                ))}
                {aniversariantes.length > 8 && (
                  <p className="text-xs text-center text-muted-foreground">
                    +{plural(aniversariantes.length - 8, "aniversariante", "aniversariantes")}
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
