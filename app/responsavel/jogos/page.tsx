import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"
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
      <PortalHero
        backHref="/responsavel"
        icon={Trophy}
        title="Jogos"
        description="Consulte partidas por campeonato, resultados e placares mais recentes da escolinha."
        stats={[
          { label: "Jogos", value: partidas.length },
          { label: "Campeonatos", value: grouped.size },
          { label: "Temporada", value: "Ativa" },
        ]}
      />

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
