import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function resultadoBadge(resultado: string | null) {
  if (!resultado) return <Badge variant="outline">A realizar</Badge>
  if (resultado === "Vitoria") return <Badge className="bg-success-600">Vitória</Badge>
  if (resultado === "Derrota") return <Badge variant="destructive">Derrota</Badge>
  return <Badge variant="secondary">Empate</Badge>
}

export default async function JogosPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const partidas = await db.partida.findMany({
    include: { campeonato: true },
    orderBy: { data: "desc" },
  })

  const grouped = new Map<number, { campeonato: typeof partidas[0]["campeonato"]; partidas: typeof partidas }>()
  for (const p of partidas) {
    if (!grouped.has(p.campeonatoId)) {
      grouped.set(p.campeonatoId, { campeonato: p.campeonato, partidas: [] })
    }
    grouped.get(p.campeonatoId)!.partidas.push(p)
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Jogos</h1>
      {grouped.size === 0 && (
        <p className="text-muted-foreground">Nenhum jogo cadastrado ainda.</p>
      )}
      <div className="space-y-8">
        {Array.from(grouped.values()).map(({ campeonato, partidas: pts }) => (
          <div key={campeonato.id}>
            <h2 className="text-lg font-semibold text-brand-600 mb-4 flex items-center gap-2">
              <span className="size-2 rounded-full bg-brand-600" />
              {campeonato.nome}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pts.map((p) => {
                const data = format(new Date(p.data), "dd/MM/yyyy", { locale: ptBR })
                const placar = p.golsPro != null && p.golsContra != null
                  ? `${p.golsPro} × ${p.golsContra}`
                  : null
                return (
                  <Card key={p.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{p.adversario}</CardTitle>
                        {resultadoBadge(p.resultado)}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-1">
                      <p>{data} · Rodada {p.rodada}</p>
                      <p>{p.local === "Casa" ? "🏠 Casa" : p.local === "Fora" ? "✈️ Fora" : "⚖️ Neutro"}</p>
                      {placar && <p className="text-base font-bold text-foreground">{placar}</p>}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
