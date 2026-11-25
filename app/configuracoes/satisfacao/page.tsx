import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { PageHeader } from "@/components/layout/page-header"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { hojeNoClube, formatarDataUtc } from "@/lib/datas-clube"
import {
  calcularNps,
  categoriaDaNota,
  faixaDoNps,
  filtrarPorTurma,
  listarDetratores,
  npsPorTurma,
  rotuloRespondente,
  situacaoDaCampanha,
  turmasDaResposta,
  type CategoriaNps,
  type RespostaPainel,
} from "@/lib/satisfacao"
import { NovaPesquisa, EncerrarPesquisa } from "./satisfacao-client"

export const metadata = { title: "Satisfação — Escolinha Itaquerense" }

const ROTULO_FAIXA = { "sem-dados": "Sem respostas", excelente: "Excelente", bom: "Bom", atencao: "Atenção", critico: "Crítico" } as const
const COR_FAIXA = { "sem-dados": "text-muted-foreground", excelente: "text-success-700", bom: "text-success-700", atencao: "text-warning-700", critico: "text-danger-700" } as const
const ROTULO_CATEGORIA: Record<CategoriaNps, string> = { promotor: "Promotor", neutro: "Neutro", detrator: "Detrator" }
const COR_CATEGORIA: Record<CategoriaNps, string> = { promotor: "bg-success-50 text-success-700", neutro: "bg-muted text-foreground", detrator: "bg-danger-50 text-danger-700" }
const ROTULO_SITUACAO = { aberta: "Aberta", agendada: "Agendada", encerrada: "Encerrada" } as const

type Busca = { pesquisa?: string | string[]; turma?: string | string[]; anonimo?: string | string[] }
const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export default async function SatisfacaoPage({ searchParams }: { searchParams: Promise<Busca> }) {
  await requireAuth(["admin", "secretaria"])
  const params = await searchParams
  const config = getConfig()
  const hoje = hojeNoClube()

  const campanhas = await db.pesquisaSatisfacao.findMany({
    orderBy: { inicio: "desc" },
    take: 12,
    select: { id: true, titulo: true, pergunta: true, inicio: true, fim: true, encerradaEm: true, lembrete: true, _count: { select: { respostas: true } } },
  })
  const idPedido = Number(primeiro(params.pesquisa))
  const atual = campanhas.find((c) => c.id === idPedido) ?? campanhas.find((c) => situacaoDaCampanha(c, hoje) !== "encerrada") ?? campanhas[0] ?? null
  const turmaFiltro = primeiro(params.turma) || null
  const anonimizar = primeiro(params.anonimo) === "1"
  const haCampanhaAtiva = campanhas.some((c) => situacaoDaCampanha(c, hoje) !== "encerrada")

  const [respostasBrutas, familiasElegiveis] = atual
    ? await Promise.all([
        db.respostaSatisfacao.findMany({
          where: { pesquisaId: atual.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, nota: true, comentario: true, turmas: true, anonimo: true, createdAt: true, responsavel: { select: { id: true, nome: true, telefone: true } } },
        }),
        db.responsavel.count({ where: { ativo: true, alunos: { some: { status: "Ativo" } } } }),
      ])
    : [[] as RespostaPainel[], 0]

  const respostas: RespostaPainel[] = respostasBrutas
  const turmasDisponiveis = npsPorTurma(respostas).map((t) => t.turma).sort((a, b) => a.localeCompare(b, "pt-BR"))
  const filtradas = filtrarPorTurma(respostas, turmaFiltro)
  const resumo = calcularNps(filtradas.map((r) => r.nota))
  const faixa = faixaDoNps(resumo.nps)
  const porTurma = npsPorTurma(respostas)
  const detratores = listarDetratores(filtradas, { clube: config.nome, anonimizar, modelos: config.modelosMensagem })
  const comentarios = filtradas.filter((r) => r.comentario)
  const taxa = familiasElegiveis > 0 && atual ? Math.round((atual._count.respostas / familiasElegiveis) * 100) : null
  const maiorBarra = Math.max(1, ...resumo.distribuicao)
  const href = (extra: Record<string, string | null>) => {
    const q = new URLSearchParams()
    if (atual) q.set("pesquisa", String(atual.id))
    const mesclado = { turma: turmaFiltro, anonimo: anonimizar ? "1" : null, ...extra }
    for (const [k, v] of Object.entries(mesclado)) if (v) q.set(k, v)
    return `/configuracoes/satisfacao?${q.toString()}`
  }

  return (
    <div className={PAGINA_ADMIN}>
      <PageHeader title="Pesquisa de satisfação" description="Uma pergunta de 0 a 10 para as famílias. O NPS mostra quantas recomendariam a escolinha e quem precisa de um contato acolhedor." />

      <NovaPesquisa bloqueada={haCampanhaAtiva} />

      {campanhas.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nenhuma pesquisa criada ainda. Crie a primeira acima; a família a verá em &quot;Precisa de você&quot; no portal.</p>
      ) : (
        <>
          <nav aria-label="Campanhas" className="flex flex-wrap gap-2">
            {campanhas.map((c) => (
              <Link
                key={c.id}
                href={`/configuracoes/satisfacao?pesquisa=${c.id}`}
                aria-current={atual?.id === c.id ? "page" : undefined}
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-semibold aria-[current=page]:border-brand-700 aria-[current=page]:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {c.titulo}
                <span className="text-xs font-normal text-muted-foreground">{ROTULO_SITUACAO[situacaoDaCampanha(c, hoje)]}</span>
              </Link>
            ))}
          </nav>

          {atual && (
            <section aria-labelledby="campanha-titulo" className="space-y-6">
              <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 id="campanha-titulo" className="font-heading text-lg font-bold">{atual.titulo}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatarDataUtc(atual.inicio)} a {formatarDataUtc(atual.fim)} · {ROTULO_SITUACAO[situacaoDaCampanha(atual, hoje)]}
                    {atual.lembrete ? " · com lembrete por notificação" : ""}
                  </p>
                  <p className="mt-1 text-sm">{atual.pergunta}</p>
                </div>
                {situacaoDaCampanha(atual, hoje) !== "encerrada" && <EncerrarPesquisa id={atual.id} titulo={atual.titulo} />}
              </div>

              <form method="get" action="/configuracoes/satisfacao" className="flex flex-wrap items-end gap-3" aria-label="Filtros do painel">
                <input type="hidden" name="pesquisa" value={atual.id} />
                <div className="flex flex-col gap-1">
                  <label htmlFor="filtro-turma" className="text-sm font-medium">Turma</label>
                  <select id="filtro-turma" name="turma" defaultValue={turmaFiltro ?? ""} className="h-11 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Todas as turmas</option>
                    {turmasDisponiveis.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name="anonimo" value="1" defaultChecked={anonimizar} className="size-4" />
                  Ocultar nomes (para apresentar)
                </label>
                <button type="submit" className="h-11 rounded-lg border bg-background px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Aplicar</button>
                {(turmaFiltro || anonimizar) && <Link href={href({ turma: null, anonimo: null })} className="inline-flex min-h-11 items-center text-sm font-semibold underline-offset-4 hover:underline">Limpar</Link>}
              </form>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">NPS</p>
                  <p className={`mt-1 text-3xl font-extrabold ${COR_FAIXA[faixa]}`}>{resumo.nps ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{ROTULO_FAIXA[faixa]}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Respostas</p>
                  <p className="mt-1 text-3xl font-extrabold">{resumo.total}</p>
                  <p className="text-xs text-muted-foreground">{taxa !== null && !turmaFiltro ? `${taxa}% das famílias` : turmaFiltro ? `Turma ${turmaFiltro}` : "Sem famílias ativas"}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Promotores</p>
                  <p className="mt-1 text-3xl font-extrabold text-success-700">{resumo.promotores}</p>
                  <p className="text-xs text-muted-foreground">Notas 9 e 10 · neutros {resumo.neutros}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Detratores</p>
                  <p className="mt-1 text-3xl font-extrabold text-danger-700">{resumo.detratores}</p>
                  <p className="text-xs text-muted-foreground">Notas de 0 a 6</p>
                </div>
              </div>

              <section aria-labelledby="dist-titulo" className="rounded-xl border bg-card p-4">
                <h3 id="dist-titulo" className="text-base font-bold">Distribuição das notas</h3>
                {resumo.total === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Ainda não há respostas {turmaFiltro ? "nesta turma" : "nesta pesquisa"}.</p>
                ) : (
                  <ol className="mt-3 space-y-1.5" aria-label="Quantidade de respostas por nota">
                    {resumo.distribuicao.map((qtd, nota) => (
                      <li key={nota} className="flex items-center gap-3 text-sm">
                        <span className="w-6 shrink-0 text-right font-semibold tabular-nums">{nota}</span>
                        <span className="h-4 flex-1 overflow-hidden rounded bg-muted" aria-hidden>
                          <span className={`block h-full rounded ${categoriaDaNota(nota) === "promotor" ? "bg-success-600" : categoriaDaNota(nota) === "neutro" ? "bg-muted-foreground" : "bg-danger-600"}`} style={{ width: `${(qtd / maiorBarra) * 100}%` }} />
                        </span>
                        <span className="w-8 shrink-0 tabular-nums text-muted-foreground">{qtd}<span className="sr-only"> respostas com nota {nota}</span></span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {porTurma.length > 0 && (
                <section aria-labelledby="turmas-titulo" className="rounded-xl border bg-card p-4">
                  <h3 id="turmas-titulo" className="text-base font-bold">NPS por turma</h3>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full min-w-[320px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                          <th scope="col" className="py-2 pr-3 font-semibold">Turma</th>
                          <th scope="col" className="py-2 pr-3 text-right font-semibold">Respostas</th>
                          <th scope="col" className="py-2 text-right font-semibold">NPS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {porTurma.map((t) => (
                          <tr key={t.turma} className="border-b last:border-0">
                            <th scope="row" className="py-2 pr-3 text-left font-medium"><Link href={href({ turma: t.turma })} className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{t.turma}</Link></th>
                            <td className="py-2 pr-3 text-right tabular-nums">{t.total}</td>
                            <td className={`py-2 text-right font-bold tabular-nums ${COR_FAIXA[faixaDoNps(t.nps)]}`}>{t.nps}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <section aria-labelledby="detratores-titulo" className="rounded-xl border bg-card p-4">
                <h3 id="detratores-titulo" className="text-base font-bold">Detratores para contato ({detratores.length})</h3>
                <p className="text-sm text-muted-foreground">Um contato acolhedor em até 48 horas costuma evitar a saída. A mensagem sai pronta e pode ser ajustada em Configurações, na aba de modelos.</p>
                {detratores.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">Nenhuma nota baixa {turmaFiltro ? "nesta turma" : "até agora"}.</p>
                ) : (
                  <ul className="mt-3 divide-y">
                    {detratores.map((d) => (
                      <li key={d.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">
                            {rotuloRespondente(d.nome)} <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-bold text-danger-700">Nota {d.nota}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{d.turmas.join(", ") || "Sem turma"} · {new Date(d.createdAt).toLocaleDateString("pt-BR")}</p>
                          {d.comentario && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{d.comentario}</p>}
                        </div>
                        {d.whatsappHref ? (
                          <a href={d.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <MessageCircle className="size-4" aria-hidden /> Chamar no WhatsApp<span className="sr-only"> ({rotuloRespondente(d.nome)}, nota {d.nota})</span>
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground sm:max-w-44 sm:text-right">{d.nome === null ? "Resposta anônima: sem contato." : "Telefone inválido no cadastro."}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="comentarios-titulo" className="rounded-xl border bg-card p-4">
                <h3 id="comentarios-titulo" className="text-base font-bold">Comentários ({comentarios.length})</h3>
                {comentarios.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Nenhum comentário por enquanto.</p>
                ) : (
                  <ul className="mt-3 divide-y">
                    {comentarios.map((r) => {
                      const oculto = r.anonimo || anonimizar
                      return (
                        <li key={r.id} className="py-3">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                            {rotuloRespondente(oculto ? null : r.responsavel.nome)}
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${COR_CATEGORIA[categoriaDaNota(r.nota)]}`}>{ROTULO_CATEGORIA[categoriaDaNota(r.nota)]} · {r.nota}</span>
                            <span className="text-xs font-normal text-muted-foreground">{turmasDaResposta(r).join(", ")}</span>
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{r.comentario}</p>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </section>
          )}
        </>
      )}
    </div>
  )
}
