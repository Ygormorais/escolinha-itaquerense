import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { ArrowLeft, Trophy } from "lucide-react"

export const metadata = { title: "Classificação — Escolinha Itaquerense" }

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

  const totalLinhas = campeonatos.reduce((acc, c) => acc + c.classificacaoFpfs.length, 0)

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
                Classificação
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Tabelas de classificação dos campeonatos em que a escolinha participa, sincronizadas da FPFS.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Campeonatos</p>
              <p className="mt-2 text-2xl font-bold">{campeonatos.length}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Times</p>
              <p className="mt-2 text-2xl font-bold">{totalLinhas}</p>
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
    </div>
  )
}
