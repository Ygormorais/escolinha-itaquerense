/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 · macrostructure: Index-First · tone: acolhedor e operacional · anchor hue: vermelho alvirrubro · slop: pass (58/58) */
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, CalendarDays, ChevronRight, CheckCircle2, Clock } from "lucide-react"
import { POSICOES_QUADRA } from "@/lib/escalacao/posicoes"
import { PageHeader } from "@/components/layout/page-header"

export const metadata = { title: "Convocações — Escolinha Itaquerense" }

export default async function ConvocacoesPage() {
  await requireAuth(["admin", "secretaria", "tecnico"])

  const partidas = await db.partida.findMany({
    orderBy: { data: "asc" },
    include: {
      campeonato: { select: { id: true, nome: true } },
      escalacao: {
        include: { aluno: { select: { nome: true, turma: true } } },
      },
    },
  })

  const agora = new Date()
  const futuras = partidas.filter((p) => p.data >= agora)
  const passadas = partidas.filter((p) => p.data < agora).reverse().slice(0, 5)

  return (
    <div
      className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8 bg-[var(--color-paper-50)]/40 p-4 sm:p-6 lg:p-8 dark:bg-transparent"
      data-slot="convocacoes-index"
    >
      <PageHeader
        title="Convocações"
        description="Monte a escalação de cada jogo arrastando os jogadores para a quadra"
      />

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock aria-hidden="true" className="size-4" /> Próximos Jogos
        </h2>

        {futuras.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center text-muted-foreground">
            <CalendarDays aria-hidden="true" className="size-10 opacity-30" />
            <p className="font-medium">Nenhum jogo agendado</p>
            <p className="text-sm">Cadastre partidas nos campeonatos para montar convocações</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            {futuras.map((p) => (
              <PartidaRow key={p.id} partida={p} />
            ))}
          </div>
        )}
      </section>

      {passadas.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <CheckCircle2 aria-hidden="true" className="size-4" /> Jogos Anteriores
          </h2>
          <div className="overflow-hidden rounded-2xl border bg-card">
            {passadas.map((p) => (
              <PartidaRow key={p.id} partida={p} passado />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

type Partida = Awaited<ReturnType<typeof db.partida.findMany>>[number] & {
  campeonato: { id: number; nome: string }
  escalacao: { posicao: string; aluno: { nome: string; turma: string } }[]
}

function PartidaRow({ partida: p, passado }: { partida: Partida; passado?: boolean }) {
  const porPosicao = Object.fromEntries(
    p.escalacao
      .filter((e) => e.posicao !== "BANCO")
      .map((e) => [e.posicao, e.aluno])
  )
  const totalTitulares = POSICOES_QUADRA.filter((pos) => porPosicao[pos]).length
  const banco = p.escalacao.filter((e) => e.posicao === "BANCO")
  const completa = totalTitulares === 5

  return (
    <article className="border-b last:border-b-0">
      <Link
        className={`group grid min-h-28 min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-4 p-4 outline-none hover:bg-muted/40 active:bg-muted/60 focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset sm:p-5 md:grid-cols-[11rem_minmax(0,1fr)_auto_auto] md:items-center md:gap-6 ${passado ? "bg-muted/15" : ""}`}
        href={`/campeonatos/${p.campeonato.id}/partidas/${p.id}/escalacao`}
      >
        <time className="col-span-2 text-sm font-semibold capitalize tabular-nums text-foreground md:col-span-1" dateTime={new Date(p.data).toISOString()}>
          {format(new Date(p.data), "EEE, dd 'de' MMM · HH:mm", { locale: ptBR })}
          {p.local ? <span className="mt-1 block text-xs font-normal text-muted-foreground">{p.local}</span> : null}
        </time>

        <div className="min-w-0">
          <p className="break-words font-semibold text-foreground">
            Itaquerense <span className="text-muted-foreground">×</span> {p.adversario}
          </p>
          <p className="mt-1 break-words text-xs text-muted-foreground">
            {p.campeonato.nome} · Rodada {p.rodada}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <Shield aria-hidden="true" className="size-3.5" /> {totalTitulares} titular{totalTitulares !== 1 ? "es" : ""}
            </span>
            {banco.length > 0 && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Users aria-hidden="true" className="size-3.5" /> {banco.length} banco
              </span>
            )}
          </div>
        </div>

        <Badge
          className={completa
            ? "self-start border border-success-600/20 bg-success-50 text-success-600 md:self-center"
            : "self-start border border-warning-600/20 bg-warning-50 text-warning-700 md:self-center"}
        >
          {totalTitulares}/5
        </Badge>

        <span className="col-span-2 flex min-h-11 items-center justify-end gap-1 whitespace-nowrap text-sm font-semibold text-brand-600 md:col-span-1">
          Editar <ChevronRight aria-hidden="true" className="size-4" />
        </span>
      </Link>
    </article>
  )
}
