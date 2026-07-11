import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, CalendarDays, ChevronRight, CheckCircle2, Clock } from "lucide-react"
import { POSICOES_QUADRA, LABEL_POSICAO } from "@/lib/escalacao/posicoes"
import { PageHeader } from "@/components/layout/page-header"

export const metadata = { title: "Convocações — Escolinha Itaquerense" }

// Posições na mini-quadra (% left/top dentro do container)
const SLOT_POS: Record<(typeof POSICOES_QUADRA)[number], { left: string; top: string }> = {
  PIVO:    { left: "22%", top: "50%" },
  ALA_DIR: { left: "45%", top: "22%" },
  ALA_ESQ: { left: "45%", top: "78%" },
  FIXO:    { left: "64%", top: "50%" },
  GOLEIRO: { left: "83%", top: "50%" },
}

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
    <div className="flex flex-col gap-8 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Convocações"
        description="Monte a escalação de cada jogo arrastando os jogadores para a quadra"
      />

      {/* Próximos jogos */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Clock className="size-4" /> Próximos Jogos
        </h2>

        {futuras.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center text-muted-foreground">
            <CalendarDays className="size-10 opacity-30" />
            <p className="font-medium">Nenhum jogo agendado</p>
            <p className="text-sm">Cadastre partidas nos campeonatos para montar convocações</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {futuras.map((p) => (
              <PartidaCard key={p.id} partida={p} />
            ))}
          </div>
        )}
      </section>

      {/* Jogos anteriores */}
      {passadas.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <CheckCircle2 className="size-4" /> Jogos Anteriores
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {passadas.map((p) => (
              <PartidaCard key={p.id} partida={p} passado />
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

function PartidaCard({ partida: p, passado }: { partida: Partida; passado?: boolean }) {
  const porPosicao = Object.fromEntries(
    p.escalacao
      .filter((e) => e.posicao !== "BANCO")
      .map((e) => [e.posicao, e.aluno])
  )
  const totalTitulares = POSICOES_QUADRA.filter((pos) => porPosicao[pos]).length
  const banco = p.escalacao.filter((e) => e.posicao === "BANCO")
  const completa = totalTitulares === 5

  const TURMA_COR: Record<string, string> = {
    "Sub-7": "#0ea5e9", "Sub-9": "#22c55e", "Sub-11": "#f59e0b",
    "Sub-13": "#6366f1", "Sub-15": "#ef4444", "Sub-17": "#0ea5e9",
  }

  return (
    <Link href={`/campeonatos/${p.campeonato.id}/partidas/${p.id}/escalacao`}>
      <div className={`group flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-px ${passado ? "opacity-70" : ""}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">
              Itaquerense <span className="text-muted-foreground">×</span> {p.adversario}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {p.campeonato.nome} · Rodada {p.rodada}
            </p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {format(new Date(p.data), "EEE, dd 'de' MMM · HH:mm", { locale: ptBR })}
              {p.local ? ` · ${p.local}` : ""}
            </p>
          </div>
          <Badge
            className={completa
              ? "bg-success-50 text-success-600 border border-success-600/20"
              : "bg-warning-50 text-warning-600 border border-warning-600/20"}
          >
            {totalTitulares}/5
          </Badge>
        </div>

        {/* Mini-quadra */}
        <div
          className="relative mx-auto w-full overflow-hidden rounded-lg border-4 border-blue-800"
          style={{ background: "linear-gradient(180deg,#1a6a2e 0%,#1e7a34 50%,#1a6a2e 100%)", aspectRatio: "5/3" }}
        >
          {/* Linhas de campo */}
          <div className="pointer-events-none absolute inset-[6px] rounded-sm border border-white/40" />
          <div className="pointer-events-none absolute bottom-[6px] top-[6px] left-1/2 w-px -translate-x-1/2 bg-white/40" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
          {/* Área esq */}
          <div className="pointer-events-none absolute left-[6px] top-1/2 h-[45%] w-[20%] -translate-y-1/2 rounded-sm border border-white/30" />
          {/* Área dir */}
          <div className="pointer-events-none absolute right-[6px] top-1/2 h-[45%] w-[20%] -translate-y-1/2 rounded-sm border border-white/30" />

          {/* Posições */}
          {POSICOES_QUADRA.map((pos) => {
            const jogador = porPosicao[pos]
            const cor = jogador ? (TURMA_COR[jogador.turma] ?? "#6366f1") : null
            return (
              <div
                key={pos}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
                style={{ left: SLOT_POS[pos].left, top: SLOT_POS[pos].top }}
              >
                {jogador ? (
                  <>
                    <div
                      className="flex size-7 items-center justify-center rounded-full border-2 border-white shadow-md text-white text-[9px] font-bold"
                      style={{ background: cor! }}
                      title={jogador.nome}
                    >
                      {jogador.nome.split(" ")[0][0]}{jogador.nome.split(" ").at(-1)?.[0]}
                    </div>
                    <span className="rounded bg-black/50 px-1 text-[8px] font-semibold leading-tight text-white">
                      {jogador.nome.split(" ")[0]}
                    </span>
                  </>
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-white/50">
                    <span className="text-[7px] font-semibold text-white/70">
                      {LABEL_POSICAO[pos].split(" ")[0].slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="size-3" /> {totalTitulares} titular{totalTitulares !== 1 ? "es" : ""}
            </span>
            {banco.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="size-3" /> {banco.length} banco
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
            Editar <ChevronRight className="size-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
