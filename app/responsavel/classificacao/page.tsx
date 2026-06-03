import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function ClassificacaoPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const campeonatos = await db.campeonato.findMany({
    include: {
      classificacaoFpfs: {
        orderBy: [{ fase: "asc" }, { grupo: "asc" }, { posicao: "asc" }],
      },
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
          const grupos = new Map<string, typeof camp.classificacaoFpfs>()
          for (const l of camp.classificacaoFpfs) {
            const chave = l.grupo ? `${l.fase} — ${l.grupo}` : l.fase
            if (!grupos.has(chave)) grupos.set(chave, [])
            grupos.get(chave)!.push(l)
          }

          return (
            <div key={camp.id}>
              <h2 className="text-lg font-semibold text-brand-600 mb-1 flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand-600" />
                {camp.nome}
                <span className="text-xs text-muted-foreground font-normal">({camp.status})</span>
              </h2>
              {camp.fpfsSyncEm && (
                <p className="mb-3 text-xs text-muted-foreground">
                  Atualizado da FPFS em {format(new Date(camp.fpfsSyncEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}

              {grupos.size === 0 && (
                <p className="text-sm text-muted-foreground">
                  Classificação ainda não sincronizada da FPFS.
                </p>
              )}

              {Array.from(grupos.entries()).map(([chave, linhas]) => (
                <div key={chave} className="mb-5">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">{chave}</h3>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted text-muted-foreground text-xs uppercase">
                          <th className="px-3 py-3 text-center">#</th>
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
                        {linhas.map((l) => (
                          <tr
                            key={l.id}
                            className={`border-t transition-colors ${l.ehNosso ? "bg-brand-600/10 font-semibold" : "hover:bg-muted/50"}`}
                          >
                            <td className="px-3 py-3 text-center">{l.posicao}</td>
                            <td className="px-4 py-3 flex items-center gap-2">
                              {l.ehNosso && <span className="size-2 rounded-full bg-brand-600" />}
                              {l.timeNome}
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-brand-600">{l.pontos}</td>
                            <td className="px-3 py-3 text-center">{l.jogos}</td>
                            <td className="px-3 py-3 text-center text-success-600">{l.vitorias}</td>
                            <td className="px-3 py-3 text-center text-muted-foreground">{l.empates}</td>
                            <td className="px-3 py-3 text-center text-destructive">{l.derrotas}</td>
                            <td className="px-3 py-3 text-center">{l.golsPro}</td>
                            <td className="px-3 py-3 text-center">{l.golsContra}</td>
                            <td className={`px-3 py-3 text-center font-semibold ${l.saldo >= 0 ? "text-success-600" : "text-destructive"}`}>
                              {l.saldo > 0 ? `+${l.saldo}` : l.saldo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </>
  )
}
