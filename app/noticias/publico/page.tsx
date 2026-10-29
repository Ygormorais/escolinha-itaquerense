import Image from "next/image"
import Link from "next/link"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PaginaPublica } from "@/components/site/pagina-publica"

export const metadata = { title: "Notícias — E.C. Itaquerense" }

const CORES: Record<string, string> = {
  "Resultado":  "linear-gradient(140deg,var(--success-600) 0%,#1FA87A 100%)",
  "Conquista":  "linear-gradient(140deg,var(--brand-950) 0%,var(--brand-600) 55%,color-mix(in oklab, var(--brand-600) 50%, var(--brand-500)) 100%)",
  "Convocação": "linear-gradient(140deg,var(--brand-950) 0%,var(--brand-800) 100%)",
  "Evento":     "linear-gradient(140deg,var(--brand-950) 0%,var(--brand-600) 60%,color-mix(in oklab, var(--brand-600) 50%, var(--brand-500)) 100%)",
  "Comunicado": "linear-gradient(140deg,var(--brand-950) 0%,var(--brand-900) 100%)",
  "Notícia":    "linear-gradient(140deg,var(--brand-950) 0%,var(--brand-600) 60%,color-mix(in oklab, var(--brand-600) 50%, var(--brand-500)) 100%)",
}

const css = `
  /* GRID */
  .np .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  @media(max-width:900px){.np .grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:560px){.np .grid{grid-template-columns:1fr}}

  /* CARD */
  .np .card{border-radius:var(--radius-sm);overflow:hidden;background:var(--bg-card);
    border:1px solid var(--border);display:flex;flex-direction:column}
  .np .card-img{position:relative;height:180px;flex-shrink:0}
  .np .card-img img{width:100%;height:100%;object-fit:cover}
  .np .card-img-grad{position:absolute;inset:0}
  .np .card-pattern{position:absolute;inset:0;
    background:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,.06)' stroke-width='1'%3E%3Ccircle cx='20' cy='20' r='12'/%3E%3C/g%3E%3C/svg%3E");
    background-size:40px 40px}
  .np .card-logo{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
  .np .card-logo img{width:52px;height:52px;object-fit:contain;opacity:.18}
  .np .card-badge{position:absolute;top:12px;left:12px;
    background:color-mix(in srgb, var(--ink-950) 72%, transparent);color:#fff;font-size:12px;font-weight:700;
    padding:4px 10px;border-radius:var(--radius-pill);backdrop-filter:blur(6px)}
  .np .card-body{padding:20px 22px 22px;flex:1;display:flex;flex-direction:column;gap:10px}
  .np .card-titulo{font-family:var(--font-heading),Georgia,serif;font-size:17px;font-weight:800;
    color:var(--text);line-height:1.25;letter-spacing:-.2px;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .np .card-sub{font-size:13px;color:var(--text-muted);line-height:1.55;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1}
  .np .card-date{font-size:13px;color:var(--text-muted)}

`

export default async function NoticiasPublicoPage() {
  const noticias = await db.noticia.findMany({
    where: { publicado: true },
    orderBy: [{ destaque: "desc" }, { createdAt: "desc" }],
    select: { id: true, titulo: true, subtitulo: true, categoria: true, imagemUrl: true, createdAt: true },
  })

  return (
    <PaginaPublica
      titulo="Notícias"
      descricao="Resultados, convocações, eventos e comunicados do E.C. Itaquerense."
      className="np"
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
          {noticias.length === 0 ? (
            <div className="pg-vazio">
              <h2>Nenhuma publicação ainda</h2>
              <p>As notícias, convocações e comunicados do clube aparecem aqui assim que forem publicados.</p>
              <Link href="/partidas" className="pg-btn pg-btn-primario">Ver as partidas</Link>
            </div>
          ) : (
            <div className="grid">
              {noticias.map((n) => {
                const grad = CORES[n.categoria] ?? CORES["Notícia"]
                return (
                  <div className="card" key={n.id}>
                    <div className="card-img">
                      {n.imagemUrl ? (
                        <Image src={n.imagemUrl} alt={n.titulo} fill style={{ objectFit: "cover" }} />
                      ) : (
                        <>
                          <div className="card-img-grad" style={{ background: grad }} />
                          <div className="card-pattern" />
                          <div className="card-logo">
                            <Image src="/logo.png" alt="" width={52} height={52} aria-hidden />
                          </div>
                        </>
                      )}
                      <div className="card-badge">{n.categoria}</div>
                    </div>
                    <div className="card-body">
                      <div className="card-titulo">{n.titulo}</div>
                      {n.subtitulo && <div className="card-sub">{n.subtitulo}</div>}
                      <div className="card-date">{format(new Date(n.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
    </PaginaPublica>
  )
}
