import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"
import { ConvocacaoCard } from "@/components/responsavel/convocacao-card"

function resultadoBadge(resultado: string | null) {
  if (!resultado) return <Badge variant="outline">A realizar</Badge>
  if (resultado === "Vitoria") return <Badge className="bg-success-600">Vitória</Badge>
  if (resultado === "Derrota") return <Badge variant="destructive">Derrota</Badge>
  return <Badge variant="secondary">Empate</Badge>
}

export const metadata = { title: "Jogos — Escolinha Itaquerense" }

export default async function JogosPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const [partidas, convocacoes] = await Promise.all([
    db.partida.findMany({
      include: { campeonato: true },
      orderBy: { data: "desc" },
    }),
    session.responsavelId != null
      ? db.escalacaoJogador.findMany({
          where: {
            convocadoEm: { not: null },
            partida: { data: { gte: new Date() } },
            aluno: { responsavelId: session.responsavelId },
          },
          select: {
            id: true, confirmacao: true,
            aluno: { select: { nome: true } },
            partida: { select: { data: true, adversario: true, local: true } },
          },
          orderBy: { partida: { data: "asc" } },
        })
      : Promise.resolve([]),
  ])

  const grouped = new Map<number, { campeonato: typeof partidas[0]["campeonato"]; partidas: typeof partidas }>()
  for (const p of partidas) {
    if (!grouped.has(p.campeonatoId)) {
      grouped.set(p.campeonatoId, { campeonato: p.campeonato, partidas: [] })
    }
    grouped.get(p.campeonatoId)!.partidas.push(p)
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
              <ArrowLeft className="size-4" />
              Voltar ao portal
            </Link>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Jogos
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Consulte partidas por campeonato, resultados e placares mais recentes da escolinha.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Jogos</p>
              <p className="mt-2 text-2xl font-bold">{partidas.length}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Campeonatos</p>
              <p className="mt-2 text-2xl font-bold">{grouped.size}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Temporada</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-bold">
                <Trophy className="size-5" />
                Ativa
              </p>
            </div>
          </div>
        </div>
      </section>

      {convocacoes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Convocações</h2>
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

      {grouped.size === 0 && (
        <p className="text-muted-foreground">Nenhum jogo cadastrado ainda.</p>
      )}
      <div className="space-y-8">
        {Array.from(grouped.values()).map(({ campeonato, partidas: pts }) => (
          <div key={campeonato.id}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-brand-600">
              <span className="size-2 rounded-full bg-brand-600" />
              {campeonato.nome}
            </h2>
            {campeonato.fpfsSyncEm && (
              <p className="mb-3 -mt-2 text-xs text-muted-foreground">
                Atualizado da FPFS em {format(new Date(campeonato.fpfsSyncEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pts.map((p) => {
                const data = format(new Date(p.data), "dd/MM/yyyy", { locale: ptBR })
                const placar = p.golsPro != null && p.golsContra != null
                  ? `${p.golsPro} × ${p.golsContra}`
                  : null
                return (
                  <Card key={p.id}>
                    <CardHeader className="border-b border-black/5 pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{p.adversario}</CardTitle>
                        {resultadoBadge(p.resultado)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p>{data}{!p.fpfsJogoId ? ` · Rodada ${p.rodada}` : ""}</p>
                      <p>{p.local === "Casa" ? "🏠 Casa" : p.local === "Fora" ? "✈️ Fora" : "⚖️ Neutro"}</p>
                      {placar && <p className="text-base font-bold text-foreground">{placar}</p>}
                      {p.sumulaUrl && (
                        <a
                          href={p.sumulaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs font-semibold text-brand-600 underline"
                        >
                          Ver súmula
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
