"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  User, CreditCard,
  CalendarCheck, Shirt, MessageSquare, Phone, ArrowRight, CircleCheck, Clock3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { formatMoney } from "@/lib/utils"
import type { RscDate } from "@/lib/rsc-date"

type Aluno = {
  id: number
  nome: string
  turma: string
  mensalidade: number
  desconto: number
  pagamentos: {
    mesReferencia: string
    dataPagamento: RscDate | null
    valorRecebido: number | null
    formaPagamento: string | null
  }[]
  frequencias: { data: RscDate; presenca: string }[]
  uniformes: { item: string; entregue: boolean }[]
}

type Comunicado = { mensagem: string; createdAt: RscDate }

export function ResponsavelDashboardClient({
  responsavel,
  comunicados,
}: {
  responsavel: { nome: string; alunos: Aluno[] }
  comunicados: Comunicado[]
}) {
  const [whatsappNumber, setWhatsappNumber] = useState("5511999999999")
  useEffect(() => {
    fetch("/api/config/public")
      .then((r) => r.json())
      .then((d) => { if (d.whatsapp) setWhatsappNumber(d.whatsapp) })
      .catch(() => {})
  }, [])

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
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.95)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.84)_100%)] px-6 py-7 text-white shadow-lg sm:px-8 sm:py-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
              Portal do Responsável
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Olá, {responsavel.nome}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Veja mensalidades, acompanhamento recente, entregas e os comunicados mais importantes da rotina na escolinha.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Alunos vinculados</p>
              <p className="mt-2 text-2xl font-bold">{totalAlunos}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Pendências</p>
              <p className="mt-2 text-2xl font-bold">{pendencias}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Comunicados</p>
              <p className="mt-2 text-2xl font-bold">{totalComunicados}</p>
            </div>
          </div>
        </div>
      </section>

      {responsavel.alunos.length > 0 && (
        <section className="grid gap-4 md:grid-cols-3">
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
                  {pendencias > 0 ? `${pendencias} pendência(s) para acompanhar.` : "Nenhuma pendência no mês atual."}
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
        </section>
      )}

      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-bold text-[var(--color-ink-950)]">Resumo dos alunos</h2>
        <p className="text-sm text-[var(--color-ink-700)]">
          Uma visão rápida da situação de cada aluno vinculado ao portal.
        </p>
      </div>

      {responsavel.alunos.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum aluno vinculado à sua conta.
          </CardContent>
        </Card>
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
                    {aluno.desconto > 0 && <span className="ml-1 text-xs text-success-600">(-{aluno.desconto.toLocaleString("pt-BR", {minimumFractionDigits: 2, maximumFractionDigits: 2})})</span>}
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
                <div className="flex items-stretch">
                  <Link href={`/responsavel/mensalidades?alunoId=${aluno.id}`} className="flex w-full">
                    <Button variant="outline" size="lg" className="w-full justify-between">
                      Ver Mensalidades
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {aluno.pagamentos.length > 0 && (
                <div className="mt-6 border-t border-black/5 pt-5">
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
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-900"
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
