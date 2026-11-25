import Link from "next/link"
import { ChevronLeft, ChevronRight, ExternalLink, MessageCircle } from "lucide-react"
import { PaginaPublica } from "@/components/site/pagina-publica"
import { EscudoTime } from "@/components/site/escudo-time"
import { ClassificacaoTabela } from "@/components/site/classificacao-tabela"
import { AnuncioBanner } from "@/components/site/anuncio-banner"
import { getAnuncio } from "@/lib/site/anuncios-dados"
import { getConfig } from "@/lib/config"
import { baseUrlSite } from "@/lib/noticias/dados"
import { whatsappCompartilharHref } from "@/lib/site/partida-compartilhar"
import { metadataPublica } from "@/lib/site/seo"
import { montarJsonLdPartidas, serializarJsonLd } from "@/lib/site/jsonld"
import { TEXTO_ANUNCIAR, whatsappUrl } from "@/lib/site/whatsapp"
import { getPartidasPublicasCached } from "@/lib/site/partidas-dados"
import { getClassificacoesPorCategoria } from "@/lib/site/classificacao"
import {
  filtrarPartidas,
  formatarDataHora,
  hrefPartidas,
  janelaPaginas,
  lerFiltros,
  ordenarCategorias,
  paginar,
  rotuloLocal,
  type FiltrosPartidas,
  type PartidaLinha,
  type Situacao,
} from "@/lib/site/partidas"
import "./partidas.css"

export const dynamic = "force-dynamic"

export const metadata = metadataPublica({
  title: "Partidas e resultados",
  description: "Agenda e resultados das categorias de base do E.C. Itaquerense, com classificação por categoria.",
  path: "/partidas",
})

const SITUACOES: { valor: Situacao; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todas" },
  { valor: "proximos", rotulo: "Próximas" },
  { valor: "realizados", rotulo: "Realizadas" },
]

const RESULTADO: Record<PartidaLinha["resultado"], { rotulo: string; tom: string } | null> = {
  Vitoria: { rotulo: "Vitória", tom: "win" },
  Derrota: { rotulo: "Derrota", tom: "loss" },
  Empate: { rotulo: "Empate", tom: "draw" },
  Proximo: null,
  SemPlacar: { rotulo: "Sem placar", tom: "none" },
}

function Linha({ p, base }: { p: PartidaLinha; base: string }) {
  const { dia, hora } = formatarDataHora(p.data)
  const res = RESULTADO[p.resultado]
  const compartilhar = whatsappCompartilharHref(p, base)
  const placarFalado = p.placar ? `${p.casa} ${p.placar[0]}, ${p.fora} ${p.placar[1]}` : `${p.casa} contra ${p.fora}`
  return (
    <li className={"pt-linha" + (res ? ` is-${res.tom}` : " is-next")}>
      <div className="pt-data">
        <span data-numeric>{dia}</span>
        {hora && <span className="pt-hora" data-numeric>{hora}</span>}
      </div>

      <div className="pt-jogo" aria-label={placarFalado}>
        <span className="pt-time pt-casa" aria-hidden>{p.casa}</span>
        <span className="pt-centro" aria-hidden>
          <EscudoTime nome={p.casa} nosso={p.nosCasa} urls={p.escudosAdversario} />
          {p.placar ? (
            <span className="pt-placar" data-numeric>
              {p.placar[0]}<span className="pt-x">×</span>{p.placar[1]}
            </span>
          ) : (
            <span className="pt-x">×</span>
          )}
          <EscudoTime nome={p.fora} nosso={!p.nosCasa} urls={p.escudosAdversario} />
        </span>
        <span className="pt-time pt-fora" aria-hidden>{p.fora}</span>
      </div>

      <div className="pt-detalhes">
        <strong>{p.categoria}</strong>
        <span>{p.competicao}</span>
        <span>{rotuloLocal(p.local)}</span>
      </div>

      <div className="pt-acao">
        {res && <span className={`pt-res pt-res-${res.tom}`}>{res.rotulo}</span>}
        {compartilhar && (
          <a href={compartilhar} target="_blank" rel="noopener noreferrer" className="pt-link pt-compartilhar">
            <MessageCircle size={14} strokeWidth={2.25} aria-hidden />
            Compartilhar
            <span className="sr-only"> resultado {p.casa} contra {p.fora} no WhatsApp (abre em nova aba)</span>
          </a>
        )}
        {p.externo && (
          <a href={p.href} target="_blank" rel="noopener noreferrer" className="pt-link">
            {p.temSumula ? "Súmula" : "Na FPFS"}
            <ExternalLink size={13} strokeWidth={2.25} aria-hidden />
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        )}
      </div>
    </li>
  )
}

function Paginacao({ f, pagina, total }: { f: FiltrosPartidas; pagina: number; total: number }) {
  if (total <= 1) return null
  return (
    <nav className="pt-pag" aria-label="Páginas">
      {pagina > 1 ? (
        <Link href={hrefPartidas(f, { pagina: pagina - 1 })} className="pt-pag-btn" aria-label="Página anterior">
          <ChevronLeft size={16} aria-hidden />
        </Link>
      ) : (
        <span className="pt-pag-btn is-off" aria-hidden><ChevronLeft size={16} /></span>
      )}
      {janelaPaginas(pagina, total).map((n, i) =>
        n === null ? (
          <span key={`salto-${i}`} className="pt-pag-gap" aria-hidden>…</span>
        ) : (
          <Link
            key={n}
            href={hrefPartidas(f, { pagina: n })}
            className={"pt-pag-btn" + (n === pagina ? " is-on" : "")}
            aria-current={n === pagina ? "page" : undefined}
            data-numeric
          >
            {n}
          </Link>
        ),
      )}
      {pagina < total ? (
        <Link href={hrefPartidas(f, { pagina: pagina + 1 })} className="pt-pag-btn" aria-label="Próxima página">
          <ChevronRight size={16} aria-hidden />
        </Link>
      ) : (
        <span className="pt-pag-btn is-off" aria-hidden><ChevronRight size={16} /></span>
      )}
    </nav>
  )
}

export default async function PartidasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const f = lerFiltros(await searchParams)
  const [todas, classificacoes, anuncio] = await Promise.all([
    getPartidasPublicasCached(),
    getClassificacoesPorCategoria(),
    getAnuncio("partidas"),
  ])

  const categorias = [...new Set([...todas.map((p) => p.categoria), ...classificacoes.keys()])].sort(ordenarCategorias)
  const filtradas = filtrarPartidas(todas, f, new Date())
  const { itens, pagina, totalPaginas } = paginar(filtradas, f.pagina)
  const base = baseUrlSite()
  const classificacao = f.categoria ? classificacoes.get(f.categoria) : undefined
  // Próximos jogos em casa como SportsEvent (só times e datas; nada de dado de aluno).
  const eventosLd = montarJsonLdPartidas(todas, getConfig(), process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")

  return (
    <PaginaPublica
      titulo="Partidas"
      descricao="Agenda e resultados das categorias de base do Elite Itaquerense, com a classificação de cada categoria."
      className="pt"
    >
      {eventosLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializarJsonLd(eventosLd) }}
        />
      )}
          <div className="pt-filtros">
            <nav className="pt-cats" aria-label="Categoria">
              <Link href={hrefPartidas(f, { categoria: null })} className={"pg-pill" + (!f.categoria ? " is-on" : "")} aria-current={!f.categoria ? "page" : undefined}>
                Todas as categorias
              </Link>
              {categorias.map((c) => (
                <Link key={c} href={hrefPartidas(f, { categoria: c })} className={"pg-pill" + (f.categoria === c ? " is-on" : "")} aria-current={f.categoria === c ? "page" : undefined}>
                  {c}
                </Link>
              ))}
            </nav>
            <nav className="pg-seg" aria-label="Situação">
              {SITUACOES.map((s) => (
                <Link key={s.valor} href={hrefPartidas(f, { situacao: s.valor })} className={f.situacao === s.valor ? "is-on" : undefined} aria-current={f.situacao === s.valor ? "page" : undefined}>
                  {s.rotulo}
                </Link>
              ))}
            </nav>
          </div>

          <p className="pt-total" role="status">
            <span data-numeric>{filtradas.length}</span> {filtradas.length === 1 ? "partida" : "partidas"}
            {f.categoria ? ` no ${f.categoria}` : ""}
            {totalPaginas > 1 && <> · página <span data-numeric>{pagina}</span> de <span data-numeric>{totalPaginas}</span></>}
          </p>

          {itens.length > 0 ? (
            <>
              <div className="pt-cab" aria-hidden>
                <span>Data</span>
                <span>Partida</span>
                <span>Detalhes</span>
              </div>
              <ol className="pt-lista">
                {itens.map((p) => <Linha key={p.id} p={p} base={base} />)}
              </ol>
            </>
          ) : (
            <div className="pg-vazio">
              <h2>Nenhuma partida com esses filtros</h2>
              <p>Troque a categoria ou a situação para ver outros jogos.</p>
              <Link href="/partidas" className="pg-btn pg-btn-primario">Ver todas as partidas</Link>
            </div>
          )}

          <Paginacao f={f} pagina={pagina} total={totalPaginas} />

          <AnuncioBanner anuncio={anuncio} dentroDeContainer contratarUrl={whatsappUrl(getConfig().whatsapp, TEXTO_ANUNCIAR)} />

          <section className="pt-classif" aria-labelledby="pt-classif-h">
            <h2 id="pt-classif-h" className="pg-secao">Classificação{f.categoria ? ` · ${f.categoria}` : ""}</h2>
            {classificacao ? (
              <ClassificacaoTabela camp={classificacao} />
            ) : f.categoria ? (
              <p className="pt-nota">Ainda não há classificação publicada para o {f.categoria}.</p>
            ) : (
              <p className="pt-nota">Escolha uma categoria acima para ver a tabela de classificação.</p>
            )}
          </section>
    </PaginaPublica>
  )
}
