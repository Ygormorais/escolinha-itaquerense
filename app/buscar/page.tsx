import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PaginaPublica } from "@/components/site/pagina-publica"
import { db } from "@/lib/db"
import { getPartidasPublicasCached } from "@/lib/site/partidas-dados"
import { buscarNoSite, MIN_CARACTERES } from "@/lib/site/busca"
import { MATERIAS } from "@/lib/landing/materias"
import "./buscar.css"

export const dynamic = "force-dynamic"
export const metadata = { title: "Buscar — E.C. Itaquerense", robots: { index: false } }

export default async function BuscarPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q: qRaw } = await searchParams
  const q = (Array.isArray(qRaw) ? qRaw[0] : qRaw)?.slice(0, 80) ?? ""

  const [noticias, partidas] = q.trim().length >= MIN_CARACTERES
    ? await Promise.all([
        db.noticia.findMany({
          where: { publicado: true },
          select: { id: true, titulo: true, subtitulo: true, categoria: true, createdAt: true },
        }),
        getPartidasPublicasCached(),
      ])
    : [[], []]
  const r = buscarNoSite(q, noticias, partidas, MATERIAS)
  const total = r.materias.length + r.noticias.length + r.partidas.length

  return (
    <PaginaPublica titulo="Buscar" descricao="História, notícias e partidas do E.C. Itaquerense." className="bs">
      <form action="/buscar" method="get" role="search" className="bs-form">
        <label htmlFor="bs-q" className="sr-only">Buscar no site</label>
        <input id="bs-q" type="search" name="q" defaultValue={q} placeholder="Ex.: Mundial, Sub-13, nome do adversário" minLength={MIN_CARACTERES} required />
        <button type="submit" className="pg-btn pg-btn-primario">Buscar</button>
      </form>

      {r.termos.length === 0 ? (
        <p className="bs-dica">Digite pelo menos {MIN_CARACTERES} letras para buscar.</p>
      ) : total === 0 ? (
        <div className="pg-vazio">
          <h2>Nada encontrado para “{q}”</h2>
          <p>Tente outra palavra, o nome de uma categoria (como Sub-11) ou de um adversário.</p>
          <Link href="/partidas" className="pg-btn pg-btn-secundario">Ver todas as partidas</Link>
        </div>
      ) : (
        <>
          <p className="bs-total" role="status">{total} {total === 1 ? "resultado" : "resultados"} para “{q}”</p>

          {r.materias.length > 0 && (
            <section aria-labelledby="bs-materias">
              <h2 id="bs-materias" className="pg-secao">História e conquistas</h2>
              <ul className="bs-lista">
                {r.materias.map((m) => (
                  <li key={m.id}>
                    <a
                      href={m.href ?? "/#materias"}
                      className="bs-item"
                      {...(m.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      <span className="bs-meta">{[m.badge, m.periodo, m.fonte].filter(Boolean).join(" · ")}</span>
                      <strong>{m.titulo}</strong>
                      <span className="bs-sub">{m.resumo}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.noticias.length > 0 && (
            <section aria-labelledby="bs-noticias">
              <h2 id="bs-noticias" className="pg-secao">Notícias</h2>
              <ul className="bs-lista">
                {r.noticias.map((n) => (
                  <li key={n.id}>
                    <Link href="/noticias/publico" className="bs-item">
                      <span className="bs-meta">{n.categoria} · {format(n.createdAt, "dd/MM/yyyy", { locale: ptBR })}</span>
                      <strong>{n.titulo}</strong>
                      {n.subtitulo && <span className="bs-sub">{n.subtitulo}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {r.partidas.length > 0 && (
            <section aria-labelledby="bs-partidas">
              <h2 id="bs-partidas" className="pg-secao">Partidas</h2>
              <ul className="bs-lista">
                {r.partidas.map((p) => (
                  <li key={p.id}>
                    <a href={p.href} className="bs-item" {...(p.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      <span className="bs-meta">{p.categoria} · {p.competicao} · {format(new Date(p.data), "dd/MM/yyyy", { locale: ptBR })}</span>
                      <strong>{p.casa} × {p.fora}</strong>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </PaginaPublica>
  )
}
