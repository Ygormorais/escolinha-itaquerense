"use client"

import Link from "next/link"
import {
  User, CreditCard,
  CalendarCheck, Shirt, MessageSquare, Phone, ArrowRight, CircleCheck, Clock3, CalendarDays, Trophy,
  Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatMoney, plural } from "@/lib/utils"
import type { RscDate } from "@/lib/rsc-date"
import type { ItemAgendaDashboard } from "@/lib/responsavel-eventos"
import { HistoricoPagamentos } from "@/components/responsavel/historico-pagamentos"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { EmptyState } from "@/components/ui/empty-state"
import type { JogoPortal } from "@/lib/responsavel-jogos"
import { nomeTime } from "@/lib/landing/times"
import { AdvCrest } from "@/components/responsavel/adv-crest"
import { buildWhatsAppHref } from "@/lib/browser-safety"

type Aluno = {
  id: number
  nome: string
  turma: string
  mensalidade: number
  desconto: number
  pagamentos: {
    mesReferencia: string
    dataVencimento: RscDate
    dataPagamento: RscDate | null
    valorRecebido: number | null
    formaPagamento: string | null
  }[]
  frequencias: { data: RscDate; presenca: string }[]
  uniformes: { item: string; entregue: boolean }[]
}

type Comunicado = { mensagem: string; createdAt: RscDate }

function placarLabel(j: JogoPortal): string {
  if (j.golsPro != null && j.golsContra != null) return `${j.golsPro} × ${j.golsContra}`
  return "A realizar"
}

export function ResponsavelDashboardClient({
  responsavel,
  comunicados,
  proximosEventos,
  jogos = { proximos: [], recentes: [] },
  whatsapp = "5511999999999",
}: {
  responsavel: { nome: string; alunos: Aluno[] }
  comunicados: Comunicado[]
  proximosEventos: ItemAgendaDashboard[]
  jogos?: { proximos: JogoPortal[]; recentes: JogoPortal[] }
  whatsapp?: string
}) {
  const whatsappHref = buildWhatsAppHref(whatsapp)

  function statusPagamento(aluno: Aluno): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
    const mesAtual = format(new Date(), "yyyy-MM")
    const pago = aluno.pagamentos.find((p) => p.mesReferencia === mesAtual)
    if (pago?.dataPagamento) return { label: "Em dia", variant: "default" }
    return { label: "Pendente", variant: "destructive" }
  }

  function frequenciaUltimos(aluno: Aluno): string {
    const recentes = aluno.frequencias.slice(0, 5)
    if (recentes.length === 0) return "Nenhum registro"
    const presencas = recentes.filter((f) => f.presenca === "Presente").length
    return `${presencas}/${recentes.length} presenças`
  }

  const totalAlunos = responsavel.alunos.length
  const pendencias = responsavel.alunos.filter((aluno) => statusPagamento(aluno).label !== "Em dia").length
  const totalComunicados = comunicados.length

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        badge="Portal do Responsável"
        title={`Olá, ${responsavel.nome}`}
        description="Veja mensalidades, acompanhamento recente, entregas e os comunicados mais importantes da rotina na escolinha."
        stats={[
          { label: "Alunos vinculados", value: totalAlunos },
          { label: "Pendências", value: pendencias },
          { label: "Comunicados", value: totalComunicados },
        ]}
      />

      {responsavel.alunos.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-start gap-3 py-1">
              <div className="mt-1 rounded-lg bg-brand-50 p-2 text-brand-800">
                <User className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink-950)]">Alunos ativos</p>
                <p className="mt-1 text-sm text-[var(--color-ink-700)]">
                  {totalAlunos} {totalAlunos === 1 ? "aluno vinculado" : "alunos vinculados"} a esta conta.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 py-1">
              <div className="mt-1 rounded-lg bg-warning-50 p-2 text-warning-600">
                <Clock3 className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink-950)]">Situação financeira</p>
                <p className="mt-1 text-sm text-[var(--color-ink-700)]">
                  {pendencias > 0 ? `${plural(pendencias, "pendência", "pendências", "nenhuma")} para acompanhar.` : "Nenhuma pendência no mês atual."}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 py-1">
              <div className="mt-1 rounded-lg bg-success-50 p-2 text-success-600">
                <CircleCheck className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink-950)]">Acompanhamento</p>
                <p className="mt-1 text-sm text-[var(--color-ink-700)]">
                  Consulte presença, uniforme e histórico recente em um só lugar.
                </p>
              </div>
            </CardContent>
          </Card>
          <Link href="/responsavel/jogos" className="group">
            <Card className="h-full transition-colors hover:border-brand-300 hover:bg-brand-50/40">
              <CardContent className="flex items-start gap-3 py-1">
                <div className="mt-1 rounded-lg bg-brand-50 p-2 text-brand-700 transition-colors group-hover:bg-brand-100">
                  <Trophy className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink-950)]">Jogos</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-brand-600 font-medium">
                    Ver partidas <ArrowRight className="size-3" />
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>
      )}

      {/* Jogos FPFS das categorias dos alunos */}
      {(jogos.proximos.length > 0 || jogos.recentes.length > 0) && (
        <Card className="overflow-hidden border-brand-100 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-brand-50/40 pb-4 dark:bg-brand-950/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 font-heading text-lg font-extrabold">
                <Trophy className="size-5 text-brand-600" />
                Jogos das categorias
              </CardTitle>
              <Link
                href="/responsavel/jogos"
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
              >
                Ver todos
                <ArrowRight className="size-3" />
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Partidas FPFS das turmas dos seus atletas (próximos e resultados recentes).
            </p>
          </CardHeader>
          <CardContent className="grid gap-6 pt-5 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-800/80">
                Próximos
              </p>
              {jogos.proximos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  Nenhum jogo agendado no momento.
                </p>
              ) : (
                jogos.proximos.map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-[var(--color-paper-50)] px-3 py-3 dark:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AdvCrest urls={j.foraEscudos ?? []} name={nomeTime(j.adversario)} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          vs {nomeTime(j.adversario)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {j.categoria} · {format(new Date(j.data), "dd/MM · HH'h'mm", { locale: ptBR })} · {j.local}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 border-brand-200 text-brand-700">
                      VS
                    </Badge>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-800/80">
                Últimos resultados
              </p>
              {jogos.recentes.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  Sem resultados recentes.
                </p>
              ) : (
                jogos.recentes.map((j) => (
                  <div
                    key={j.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-[var(--color-paper-50)] px-3 py-3 dark:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <AdvCrest urls={j.foraEscudos ?? []} name={nomeTime(j.adversario)} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          vs {nomeTime(j.adversario)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {j.categoria} · {format(new Date(j.data), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-heading text-base font-extrabold tabular-nums text-foreground">
                      {placarLabel(j)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {proximosEventos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-extrabold">
              <CalendarDays className="size-5 text-brand-600" />
              Próximos eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proximosEventos.map((item) => (
              <div key={`${item.tipo}-${item.data}-${item.titulo}`} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <span
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200"
                  aria-hidden
                >
                  {item.tipo === "jogo" ? (
                    <Trophy className="size-4" strokeWidth={2.25} />
                  ) : (
                    <Megaphone className="size-4" strokeWidth={2.25} />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.titulo}</p>
                  {item.alunoNome && (
                    <p className="text-xs text-muted-foreground">{item.alunoNome}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.tipo === "jogo"
                      ? format(new Date(item.data), "dd/MM/yyyy · HH'h'mm", { locale: ptBR })
                      : format(new Date(item.data), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                {item.tipo === "jogo" && item.confirmacao === null && (
                  <Link href="/responsavel/jogos" className="text-xs font-semibold text-brand-600 hover:underline shrink-0">
                    Confirmar
                  </Link>
                )}
              </div>
            ))}
            <Link href="/responsavel/calendario" className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline pt-1">
              Ver calendário completo
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>
      )}
      {proximosEventos.length === 0 && jogos.proximos.length === 0 && jogos.recentes.length === 0 && (
        <EmptyState
          icon={CalendarDays}
          title="Nada na agenda agora"
          description="Quando houver jogos FPFS ou eventos da escolinha, eles aparecem aqui."
          href="/responsavel/calendario"
          hrefLabel="Abrir calendário"
        />
      )}

      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          Resumo dos alunos
        </h2>
        <p className="text-sm text-muted-foreground">
          Uma visão rápida da situação de cada aluno vinculado ao portal.
        </p>
      </div>

      {responsavel.alunos.length === 0 && (
        <EmptyState
          icon={User}
          title="Nenhum aluno vinculado"
          description="Assim que a secretaria vincular um atleta à sua conta, o resumo aparece aqui."
          href="/responsavel/solicitacoes"
          hrefLabel="Fazer uma solicitação"
        />
      )}

      {responsavel.alunos.map((aluno) => {
        const st = statusPagamento(aluno)
        return (
          <Card key={aluno.id} className="overflow-hidden">
            <CardHeader className="flex flex-col gap-4 border-b border-black/5 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-50 p-3 text-brand-800">
                  <User className="size-5" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-xl">{aluno.nome}</CardTitle>
                    <Badge variant="secondary" className="px-2.5 text-[11px]">{aluno.turma}</Badge>
                  </div>
                  <p className="text-sm text-[var(--color-ink-700)]">
                    Acompanhe mensalidade, frequência recente e entregas de uniforme.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={st.variant}
                  className="h-7 rounded-full px-3 text-[11px] font-semibold"
                >
                  {st.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-500)]">
                    <CreditCard className="size-3.5" /> Mensalidade
                  </p>
                  <p className="mt-3 text-lg font-semibold text-[var(--color-ink-950)]">
                    {formatMoney(aluno.mensalidade - aluno.desconto)}
                    {aluno.desconto > 0 && <span className="ml-1 text-xs text-success-600">(-{formatMoney(aluno.desconto)})</span>}
                  </p>
                </div>
                <div className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-500)]">
                    <CalendarCheck className="size-3.5" /> Frequência
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-ink-950)]">{frequenciaUltimos(aluno)}</p>
                </div>
                <div className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-500)]">
                    <Shirt className="size-3.5" /> Uniforme
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[var(--color-ink-950)]">
                    {aluno.uniformes.filter((u) => u.entregue).length}/{aluno.uniformes.length} itens
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href={`/responsavel/aluno/${aluno.id}`} className="flex w-full">
                    <Button size="lg" className="w-full justify-between bg-brand-600 hover:bg-brand-700">
                      Ver Perfil
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <Link href={`/responsavel/mensalidades?alunoId=${aluno.id}`} className="flex w-full">
                    <Button variant="outline" size="lg" className="w-full justify-between">
                      Ver Mensalidades
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="mt-6">
                <HistoricoPagamentos pagamentos={aluno.pagamentos.map(p => ({
                  mesReferencia: p.mesReferencia,
                  dataPagamento: p.dataPagamento ? String(p.dataPagamento) : null,
                  dataVencimento: String(p.dataVencimento),
                }))} />
              </div>

              {aluno.pagamentos.length > 0 && (
                <div className="mt-4 border-t border-black/5 pt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-ink-500)]">
                    Últimos Pagamentos
                  </p>
                  <div className="space-y-2">
                    {aluno.pagamentos.slice(0, 3).map((p, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-black/5 bg-[var(--color-paper-50)] px-3 py-2 text-sm">
                        <span className="font-medium text-[var(--color-ink-900)]">{p.mesReferencia}</span>
                        <span className={p.dataPagamento ? "font-semibold text-success-600" : "text-[var(--color-ink-500)]"}>
                          {p.dataPagamento ? formatMoney(p.valorRecebido ?? 0) : "Pendente"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="size-4" /> Fale Conosco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-[var(--color-ink-700)]">
            Entre em contato com a escolinha pelo WhatsApp:
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-700"
          >
            <MessageSquare className="size-4" /> Falar no WhatsApp
          </a>
        </CardContent>
      </Card>

      {comunicados.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="size-4" /> Comunicados Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {comunicados.map((c, i) => (
              <div key={i} className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink-900)]">{c.mensagem}</p>
                <p className="mt-2 text-[11px] text-[var(--color-ink-500)]">
                  {format(new Date(c.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
