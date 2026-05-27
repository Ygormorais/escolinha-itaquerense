import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

export default async function ClassificacaoPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const campeonatos = await db.campeonato.findMany({
    include: {
      partidas: { orderBy: { data: "asc" } },
    },
    orderBy: { dataInicio: "desc" },
  })

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Classificação</h1>
      {campeonatos.length === 0 && (
        <p className="text-muted-foreground">Nenhum campeonato cadastrado.</p>
      )}
      <div className="space-y-8">
        {campeonatos.map((camp) => {
          const realizadas = camp.partidas.filter((p) => p.resultado !== null)
          const vitorias = realizadas.filter((p) => p.resultado === "Vitoria").length
          const derrotas = realizadas.filter((p) => p.resultado === "Derrota").length
          const empates = realizadas.filter((p) => p.resultado === "Empate").length
          const golsPro = realizadas.reduce((s, p) => s + (p.golsPro ?? 0), 0)
          const golsContra = realizadas.reduce((s, p) => s + (p.golsContra ?? 0), 0)
          const saldo = golsPro - golsContra
          const pontos = vitorias * 3 + empates

          return (
            <div key={camp.id}>
              <h2 className="text-lg font-semibold text-brand-600 mb-3 flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand-600" />
                {camp.nome}
                <span className="text-xs text-muted-foreground font-normal">
                  ({camp.status})
                </span>
              </h2>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted text-muted-foreground text-xs uppercase">
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-3 py-3 text-center">P</th>
                      <th className="px-3 py-3 text-center">J</th>
                      <th className="px-3 py-3 text-center">V</th>
                      <th className="px-3 py-3 text-center">E</th>
                      <th className="px-3 py-3 text-center">D</th>
                      <th className="px-3 py-3 text-center">GP</th>
                      <th className="px-3 py-3 text-center">GC</th>
                      <th className="px-3 py-3 text-center">SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-semibold flex items-center gap-2">
                        <span className="size-2 rounded-full bg-brand-600" />
                        Elite Itaquerense
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-brand-600">{pontos}</td>
                      <td className="px-3 py-3 text-center">{realizadas.length}</td>
                      <td className="px-3 py-3 text-center text-success-600">{vitorias}</td>
                      <td className="px-3 py-3 text-center text-muted-foreground">{empates}</td>
                      <td className="px-3 py-3 text-center text-destructive">{derrotas}</td>
                      <td className="px-3 py-3 text-center">{golsPro}</td>
                      <td className="px-3 py-3 text-center">{golsContra}</td>
                      <td className={`px-3 py-3 text-center font-semibold ${saldo >= 0 ? "text-success-600" : "text-destructive"}`}>
                        {saldo > 0 ? `+${saldo}` : saldo}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {realizadas.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">Nenhuma partida realizada ainda.</p>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
