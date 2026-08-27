import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CircleDollarSign,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  Trophy,
  UserPlus,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { CampeonatoDetalhe } from "@/components/campeonatos/types"
import { formatMoney, plural } from "@/lib/utils"

type Custo = { label: string; valor: number }

type CampeonatoDetailOverviewProps = {
  campeonato: CampeonatoDetalhe
  status: { label: string; variant: "default" | "secondary" | "outline" }
  custos: Custo[]
  totalCustos: number
  totalPago: number
  totalPendente: number
  alunosDisponiveis: number
  sincronizando: boolean
  onSincronizar: () => void
  onEditar: () => void
  onDeletar: () => Promise<void>
  onInscrever: () => void
  onIniciar: () => Promise<void>
}

export function CampeonatoDetailOverview({
  campeonato,
  status,
  custos,
  totalCustos,
  totalPago,
  totalPendente,
  alunosDisponiveis,
  sincronizando,
  onSincronizar,
  onEditar,
  onDeletar,
  onInscrever,
  onIniciar,
}: CampeonatoDetailOverviewProps) {
  return (
    <>
      <header className="flex min-w-0 flex-col gap-4 border-b border-border/80 pb-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href="/campeonatos"
            aria-label="Voltar para campeonatos"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 [overflow-wrap:anywhere] font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {campeonato.nome}
              </h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            {campeonato.descricao && (
              <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">{campeonato.descricao}</p>
            )}
            {campeonato.fpfsSyncEm && (
              <p className="mt-1 text-xs text-muted-foreground">
                FPFS atualizada em {format(new Date(campeonato.fpfsSyncEm), "dd/MM/yyyy HH:mm")}
              </p>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
          <Button variant="outline" onClick={onSincronizar} disabled={sincronizando}>
            {sincronizando ? (
              <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Sincronizando...</>
            ) : "Sincronizar FPFS"}
          </Button>
          <Button variant="outline" onClick={onEditar}>
            <Pencil className="size-4" aria-hidden="true" /> Editar
          </Button>
          <ConfirmDialog title="Deletar campeonato?" description="Esta ação não pode ser desfeita." confirmLabel="Deletar" onConfirm={onDeletar}>
            <Button variant="outline" className="text-danger-600 hover:bg-danger-50 hover:text-danger-600">
              <Trash2 className="size-4" aria-hidden="true" /> Deletar
            </Button>
          </ConfirmDialog>
        </div>
      </header>

      <section aria-label="Visão geral do campeonato" data-slot="campeonato-detail-bento" className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="min-w-0 border-border/80 shadow-sm lg:col-span-7">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 text-brand-800" aria-hidden="true" /> Datas &amp; Local
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-muted-foreground">Início:</span> {format(new Date(campeonato.dataInicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            {campeonato.dataFim && (
              <p><span className="text-muted-foreground">Fim:</span> {format(new Date(campeonato.dataFim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            )}
            {campeonato.local && (
              <p className="flex min-w-0 items-start gap-2 sm:col-span-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 [overflow-wrap:anywhere]">{campeonato.local}</span>
              </p>
            )}
            <p className="sm:col-span-2"><span className="text-muted-foreground">Inscrições:</span> {plural(campeonato.inscricoes.length, "aluno", "alunos", "nenhum")}</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/80 shadow-sm lg:col-span-5 lg:row-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CircleDollarSign className="size-4 text-brand-800" aria-hidden="true" /> Custos do Campeonato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {custos.map((custo) => (
              <div key={custo.label} className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">{custo.label}</span>
                <span data-numeric className={custo.valor > 0 ? "font-medium" : "text-muted-foreground"}>{formatMoney(custo.valor)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 border-t border-border pt-3 font-bold text-brand-800">
              <span>Total por aluno</span>
              <span data-numeric>{formatMoney(totalCustos)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/80 shadow-sm lg:col-span-7">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CircleDollarSign className="size-4 text-brand-800" aria-hidden="true" /> Financeiro Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Alunos inscritos</span><span data-numeric>{campeonato.inscricoes.length}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Com bolsa integral</span><span data-numeric>{campeonato.inscricoes.filter((inscricao) => inscricao.bolsa).length}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Taxas pagas</span><span data-numeric>{campeonato.inscricoes.filter((inscricao) => inscricao.taxaPaga).length}</span></div>
            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Total arrecadado</span><span data-numeric className="font-medium text-success-600">{formatMoney(totalPago)}</span></div>
            <div className="flex justify-between gap-4 border-t border-border pt-3 sm:col-span-2"><span className="text-muted-foreground">A receber</span><span data-numeric className="font-bold text-warning-600">{formatMoney(totalPendente)}</span></div>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/80 shadow-sm lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4 text-brand-800" aria-hidden="true" /> Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="justify-start" variant="outline" onClick={onInscrever} disabled={alunosDisponiveis === 0}>
              <UserPlus className="size-4" aria-hidden="true" /> Inscrever Aluno
            </Button>
            {campeonato.status === "aberto" && (
              <Button className="justify-start" variant="outline" onClick={onIniciar}>
                <Trophy className="size-4" aria-hidden="true" /> Iniciar Campeonato
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}
