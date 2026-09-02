import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import {
  filtroCampeonatoPorCategorias,
  getAlunosAtivosPortal,
  turmasParaCategorias,
} from "@/lib/responsavel-alunos"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Trophy, ExternalLink, MapPin, Calendar } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { ConvocacaoCard } from "@/components/responsavel/convocacao-card"
import { EmptyState } from "@/components/ui/empty-state"
import { categoriaCurta, nomeTime } from "@/lib/landing/times"
import { candidatosEscudoAdversario } from "@/lib/landing/escudo-adversario"
import { AdvCrest } from "@/components/responsavel/adv-crest"
import { DisponibilidadeCard } from "@/components/responsavel/disponibilidade-card"
import { cn } from "@/lib/utils"
import Link from "next/link"


export const metadata = { title: "Jogos — Escolinha Itaquerense" }

function resultadoMeta(resultado: string | null, golsPro: number | null) {
  if (golsPro == null) {
    return {
      label: "Próximo",
      className: "border-brand-200 bg-brand-50 text-brand-700",
      bar: "from-brand-800 to-brand-600",
    }
  }
  if (resultado === "Vitoria") {
    return {
      label: "Vitória",
      className: "border-success-600/20 bg-success-50 text-success-600",
      bar: "from-emerald-700 to-emerald-500",
    }
  }
  if (resultado === "Derrota") {
    return {
      label: "Derrota",
      className: "border-destructive/20 bg-destructive/10 text-destructive",
      bar: "from-red-900 to-red-600",
    }
  }
  return {
    label: "Empate",
    className: "border-border bg-muted text-muted-foreground",
    bar: "from-stone-500 to-stone-400",
  }
}

function sortCat(a: string, b: string) {
  const na = Number(a.match(/Sub-(\d+)/i)?.[1])
  const nb = Number(b.match(/Sub-(\d+)/i)?.[1])
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
  return a.localeCompare(b, "pt-BR")
}

export default async function JogosPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const agora = new Date()
  const inicio = new Date(agora)
  inicio.setMonth(inicio.getMonth() - 8)

  const alunos = await getAlunosAtivosPortal(session.responsavelId)
  const turmas = turmasParaCategorias(alunos.map((a) => a.turma))
  const catFilter = filtroCampeonatoPorCategorias(turmas)

  const partidaSelect = {
    id: true,
    adversario: true,
    adversarioEscudoUrl: true,
    data: true,
    local: true,
    golsPro: true,
    golsContra: true,
    resultado: true,
    sumulaUrl: true,
    rodada: true,
    campeonato: {
      select: { id: true, nome: true, status: true, fpfsSyncEm: true },
    },
    disponibilidades: {
      where: { responsavelId: session.responsavelId },
      select: { alunoId: true, resposta: true, motivo: true },
    },
  } as const

  const [partidasPreferidas, convocacoes] = await Promise.all([
    db.partida.findMany({
      where: {
        local: { in: ["Casa", "Fora"] },
        data: { gte: inicio },
        campeonato: {
          status: { not: "encerrado" },
          ...catFilter,
        },
      },
      select: partidaSelect,
      orderBy: { data: "desc" },
      take: 80,
    }),
    db.escalacaoJogador.findMany({
      where: {
        convocadoEm: { not: null },
        partida: { data: { gte: agora } },
        aluno: { responsavelId: session.responsavelId },
      },
      select: {
        id: true,
        confirmacao: true,
        aluno: { select: { nome: true } },
        partida: { select: { data: true, adversario: true, local: true } },
      },
      orderBy: { partida: { data: "asc" } },
      take: 10,
    }),
  ])

  let base = partidasPreferidas
  if (base.length === 0 && Object.keys(catFilter).length > 0) {
    // categorias dos filhos sem jogos recentes → fallback leve
    base = await db.partida.findMany({
      where: {
        local: { in: ["Casa", "Fora"] },
        data: { gte: inicio },
        campeonato: { status: { not: "encerrado" } },
      },
      select: partidaSelect,
      orderBy: { data: "desc" },
      take: 60,
    })
  }

  type P = (typeof base)[0]
  const byCat = new Map<string, P[]>()
  for (const p of base) {
    const cat = categoriaCurta(p.campeonato.nome)
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat)!.push(p)
  }

  const categorias = [...byCat.keys()].sort(sortCat)
  const proximosTotal = base.filter((p) => p.golsPro == null && new Date(p.data) >= agora).length
  const recentesTotal = base.filter((p) => p.golsPro != null).length

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        backHref="/responsavel"
        icon={Trophy}
        title="Jogos"
        description="Partidas e resultados da FPFS nas categorias da escolinha — visual alinhado ao site público."
        stats={[
          { label: "Categorias", value: categorias.length },
          { label: "Próximos", value: proximosTotal },
          { label: "Resultados", value: recentesTotal },
        ]}
      />

      {convocacoes.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-extrabold tracking-tight">
            Convocações
          </h2>
          {convocacoes.map((c) => (
            <ConvocacaoCard
              key={c.id}
              convocacao={{
                escalacaoId: c.id,
                alunoNome: c.aluno.nome,
                adversario: c.partida.adversario,
                data: c.partida.data.toISOString(),
                local: c.partida.local,
                confirmacao: c.confirmacao,
              }}
            />
          ))}
        </section>
      )}

      {categorias.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhum jogo no momento"
          description="Quando a FPFS sincronizar partidas das categorias, elas aparecem aqui."
          href="/resultados"
          hrefLabel="Ver resultados públicos"
        />
      ) : (
        <div className="space-y-10">
          {categorias.map((cat) => {
            const lista = byCat.get(cat)!
            const proximos = lista
              .filter((p) => p.golsPro == null && new Date(p.data) >= agora)
              .sort((a, b) => a.data.getTime() - b.data.getTime())
            const recentes = lista
              .filter((p) => p.golsPro != null)
              .slice(0, 12)
            const sync = lista[0]?.campeonato.fpfsSyncEm

            return (
              <section key={cat} className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <h2 className="font-heading text-xl font-extrabold tracking-tight text-brand-600">
                      {cat}
                    </h2>
                    {sync && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        FPFS · {format(new Date(sync), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {lista.length} jogo{lista.length === 1 ? "" : "s"}
                  </p>
                </div>

                {proximos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Próximos
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {proximos.map((p) => (
                        <MatchCard
                          key={p.id}
                          p={p}
                          alunos={alunos.filter((aluno) =>
                            turmasParaCategorias([aluno.turma]).has(cat),
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {recentes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Resultados
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {recentes.map((p) => (
                        <MatchCard key={p.id} p={p} alunos={[]} />
                      ))}
                    </div>
                  </div>
                )}

                {proximos.length === 0 && recentes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem partidas nesta categoria.</p>
                )}
              </section>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Também disponível no{" "}
        <Link href="/resultados" className="font-semibold text-brand-600 hover:underline">
          site público
        </Link>
        .
      </p>
    </div>
  )
}

function MatchCard({
  p,
  alunos,
}: {
  p: {
    id: number
    adversario: string
    adversarioEscudoUrl: string | null
    data: Date
    local: string
    golsPro: number | null
    golsContra: number | null
    resultado: string | null
    sumulaUrl: string | null
    rodada: number | null
    disponibilidades: { alunoId: number; resposta: string; motivo: string | null }[]
  }
  alunos: { id: number; nome: string; turma: string }[]
}) {
  const meta = resultadoMeta(p.resultado, p.golsPro)
  const adv = nomeTime(p.adversario)
  const data = format(new Date(p.data), "dd MMM yyyy", { locale: ptBR })
  const hora = format(new Date(p.data), "HH:mm", { locale: ptBR })
  const placar =
    p.golsPro != null && p.golsContra != null ? `${p.golsPro} × ${p.golsContra}` : null
  const crests = candidatosEscudoAdversario(p.adversario, p.adversarioEscudoUrl)

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
      )}
    >
      <div className={cn("h-1 bg-gradient-to-r", meta.bar)} aria-hidden />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <AdvCrest urls={crests} name={adv} />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Itaquerense ×
              </p>
              <h3 className="font-heading text-base font-extrabold leading-snug tracking-tight truncate">
                {adv}
              </h3>
            </div>
          </div>
          <Badge variant="outline" className={cn("shrink-0 text-[10px] font-bold", meta.className)}>
            {meta.label}
          </Badge>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {data} · {hora}
            </p>
            <p className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {p.local === "Casa" ? "Casa" : p.local === "Fora" ? "Fora" : p.local}
              {p.rodada != null ? ` · ${p.rodada}ª rod.` : ""}
            </p>
          </div>
          {placar ? (
            <p className="font-heading text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
              {placar}
            </p>
          ) : (
            <p className="font-heading text-lg font-extrabold tracking-widest text-brand-600">VS</p>
          )}
        </div>

        {p.sumulaUrl && (
          <a
            href={p.sumulaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
          >
            Ver súmula na FPFS
            <ExternalLink className="size-3" />
          </a>
        )}

        {p.golsPro == null && new Date(p.data) >= new Date() && alunos.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Disponibilidade antecipada
            </p>
            {alunos.map((aluno) => {
              const atual = p.disponibilidades.find((item) => item.alunoId === aluno.id)
              return (
                <DisponibilidadeCard
                  key={aluno.id}
                  tipo="partida"
                  referenciaId={p.id}
                  alunoId={aluno.id}
                  alunoNome={aluno.nome.split(" ")[0]}
                  respostaInicial={atual?.resposta ?? null}
                  motivoInicial={atual?.motivo ?? null}
                  compacto
                />
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}
