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
import { Trophy } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { EmptyState } from "@/components/ui/empty-state"
import { categoriaCurta } from "@/lib/landing/times"
import {
  agruparPorFaseGrupo,
  preferCampPorCategoria,
  sortCategoriaSub,
  type LinhaClassifView,
} from "@/lib/classificacao-view"
import { cn } from "@/lib/utils"
import Link from "next/link"

export const metadata = { title: "Classificação — Escolinha Itaquerense" }

const classifSelect = {
  id: true,
  nome: true,
  fpfsSyncEm: true,
  dataInicio: true,
  classificacaoFpfs: {
    orderBy: [{ fase: "asc" as const }, { grupo: "asc" as const }, { posicao: "asc" as const }],
    select: {
      id: true,
      fase: true,
      grupo: true,
      posicao: true,
      timeNome: true,
      pontos: true,
      jogos: true,
      vitorias: true,
      empates: true,
      derrotas: true,
      golsPro: true,
      golsContra: true,
      saldo: true,
      ehNosso: true,
    },
  },
}

function StandingsTable({ linhas }: { linhas: LinhaClassifView[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-paper-100)] text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:bg-muted">
            <th className="px-3 py-3 text-center">#</th>
            <th className="px-4 py-3 text-left">Time</th>
            <th className="px-3 py-3 text-center">Pts</th>
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
              className={cn(
                "border-t border-border transition-colors",
                l.ehNosso
                  ? "bg-brand-50 font-semibold text-brand-900 dark:bg-brand-950/30 dark:text-brand-100"
                  : "hover:bg-muted/40",
              )}
            >
              <td className="px-3 py-2.5 text-center">
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-lg text-xs font-bold",
                    l.ehNosso
                      ? "bg-brand-600 text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {l.posicao}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-2">
                  {l.ehNosso && (
                    <span className="text-brand-600" aria-label="Nosso time">
                      ★
                    </span>
                  )}
                  {l.timeNome}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center font-extrabold tabular-nums">{l.pontos}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{l.jogos}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{l.vitorias}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{l.empates}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{l.derrotas}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{l.golsPro}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">{l.golsContra}</td>
              <td className="px-3 py-2.5 text-center tabular-nums text-muted-foreground">
                {l.saldo > 0 ? `+${l.saldo}` : l.saldo}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function ClassificacaoPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const alunos = await getAlunosAtivosPortal(session.responsavelId)
  const turmas = turmasParaCategorias(alunos.map((a) => a.turma))
  const catFilter = filtroCampeonatoPorCategorias(turmas)

  let campeonatos = await db.campeonato.findMany({
    where: {
      status: { not: "encerrado" },
      classificacaoFpfs: { some: {} },
      ...catFilter,
    },
    select: classifSelect,
    orderBy: { dataInicio: "desc" },
    take: 24,
  })

  if (campeonatos.length === 0) {
    campeonatos = await db.campeonato.findMany({
      where: {
        status: { not: "encerrado" },
        classificacaoFpfs: { some: {} },
      },
      select: classifSelect,
      orderBy: { dataInicio: "desc" },
      take: 12,
    })
  }

  const campsFiltrados =
    turmas.size > 0
      ? campeonatos.filter((c) => turmas.has(categoriaCurta(c.nome)))
      : campeonatos

  const campsRaw = campsFiltrados.length > 0 ? campsFiltrados : campeonatos
  const camps = preferCampPorCategoria(campsRaw)

  const byCat = new Map<string, (typeof camps)[number]>()
  for (const c of camps) {
    byCat.set(categoriaCurta(c.nome), c)
  }
  const categorias = [...byCat.keys()].sort(sortCategoriaSub)

  let totalLinhas = 0
  for (const c of camps) {
    // Conta só a fase geral (mesma UI)
    totalLinhas += agruparPorFaseGrupo(c.classificacaoFpfs, { soFaseGeral: true }).reduce(
      (acc, f) => acc + f.grupos.reduce((a, g) => a + g.linhas.length, 0),
      0,
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        backHref="/responsavel"
        icon={Trophy}
        title="Classificação"
        description="Tabelas FPFS das categorias em que a escolinha joga — destaque para o nosso time."
        stats={[
          { label: "Categorias", value: categorias.length },
          { label: "Tabelas", value: camps.length },
          { label: "Linhas", value: totalLinhas },
        ]}
      />

      {camps.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhuma classificação ainda"
          description="Quando a sincronização FPFS trouxer a tabela, ela aparece aqui."
          href="/resultados"
          hrefLabel="Ver no site público"
        />
      ) : (
        <div className="space-y-10">
          {categorias.map((cat) => {
            const camp = byCat.get(cat)!
            // Mesma estratégia do site público: fase Classificação/Geral
            const blocos = agruparPorFaseGrupo(camp.classificacaoFpfs, { soFaseGeral: true })
            if (blocos.length === 0) return null

            return (
              <section key={cat} className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-2">
                  <h2 className="font-heading text-xl font-extrabold tracking-tight text-brand-600">
                    {cat}
                  </h2>
                  {camp.fpfsSyncEm && (
                    <p className="text-xs text-muted-foreground">
                      Atualizado{" "}
                      {format(new Date(camp.fpfsSyncEm), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{camp.nome}</p>

                <div className="space-y-6">
                  {blocos.map(({ fase, grupos }) => (
                    <div key={fase} className="space-y-3">
                      <h3 className="text-sm font-bold tracking-tight text-foreground">{fase}</h3>
                      {grupos.map(({ grupo, linhas }) => (
                        <div key={`${fase}-${grupo ?? "_"}`} className="space-y-2">
                          {grupo && (
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                              {grupo}
                            </p>
                          )}
                          <StandingsTable linhas={linhas} />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Versão pública em{" "}
        <Link href="/resultados" className="font-semibold text-brand-600 hover:underline">
          /resultados
        </Link>
      </p>
    </div>
  )
}
