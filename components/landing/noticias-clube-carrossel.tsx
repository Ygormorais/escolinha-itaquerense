"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"

export interface NoticiaClube {
  id: number
  titulo: string
  subtitulo: string | null
  categoria: string
  imagemUrl: string | null
}

const CORES: Record<string, string> = {
  "Resultado":   "linear-gradient(140deg,#0D3B12 0%,#1B5E20 50%,#2E7D32 100%)",
  "Conquista":   "linear-gradient(140deg,#3D2B00 0%,#856000 50%,#B8860B 100%)",
  "Convocação":  "linear-gradient(140deg,#0D0D2B 0%,#1A1A2E 50%,#2D2D4E 100%)",
  "Evento":      "linear-gradient(140deg,#4A0B0B 0%,#C62828 60%,#D84040 100%)",
  "Comunicado":  "linear-gradient(140deg,#1A1A2E 0%,#2D2D4E 100%)",
  "Notícia":     "linear-gradient(140deg,#4A0B0B 0%,#C62828 60%,#D84040 100%)",
}

const css = `
  .ncc *{margin:0;padding:0;box-sizing:border-box}
  .ncc{background:var(--bg);padding:0 0 56px}
  .ncc .container{max-width:1060px;margin:0 auto;padding:0 24px}

  .ncc-header{display:flex;align-items:center;justify-content:space-between;padding-bottom:24px}
  .ncc-header h2{font-family:var(--font-heading),Georgia,serif;font-size:28px;font-weight:800;
    color:var(--text);letter-spacing:-.5px}
  .ncc-header a{font-size:13px;font-weight:600;color:var(--red);display:flex;align-items:center;gap:5px;transition:opacity .2s}
  .ncc-header a:hover{opacity:.75}

  /* Track: mostra 3 cards lado a lado, scroll controlado */
  .ncc-track-wrap{position:relative}
  .ncc-track{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  @media(max-width:760px){.ncc-track{grid-template-columns:1fr}}
  @media(max-width:1020px) and (min-width:761px){.ncc-track{grid-template-columns:repeat(2,1fr)}}

  .ncc-card{border-radius:16px;overflow:hidden;position:relative;height:220px;cursor:pointer;
    box-shadow:0 4px 16px rgba(26,26,46,.12);transition:transform .25s,box-shadow .25s}
  .ncc-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(26,26,46,.18)}
  .ncc-bg{position:absolute;inset:0}
  .ncc-bg img{width:100%;height:100%;object-fit:cover}
  .ncc-bg-grad{position:absolute;inset:0}
  .ncc-pattern{position:absolute;inset:0;
    background:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,.05)' stroke-width='1'%3E%3Ccircle cx='20' cy='20' r='12'/%3E%3Cline x1='0' y1='20' x2='40' y2='20'/%3E%3C/g%3E%3C/svg%3E");
    background-size:40px 40px}
  .ncc-logo{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
  .ncc-logo img{width:56px;height:56px;object-fit:contain;opacity:.2;filter:drop-shadow(0 2px 8px rgba(0,0,0,.3))}
  .ncc-overlay{position:absolute;bottom:0;left:0;right:0;
    background:linear-gradient(to top,rgba(0,0,0,.88) 0%,rgba(0,0,0,.5) 55%,transparent 100%);
    padding:16px 18px 18px}
  .ncc-badge{display:inline-flex;align-items:center;gap:5px;
    background:rgba(255,255,255,.15);color:rgba(255,255,255,.9);
    font-size:9px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;
    padding:3px 9px;border-radius:100px;border:1px solid rgba(255,255,255,.2);margin-bottom:8px}
  .ncc-titulo{font-family:var(--font-heading),Georgia,serif;font-size:16px;font-weight:800;
    color:#fff;line-height:1.2;letter-spacing:-.2px;
    text-shadow:0 1px 4px rgba(0,0,0,.4);margin-bottom:4px;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .ncc-sub{font-size:11px;color:rgba(255,255,255,.72);font-weight:400;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  .ncc-dots{display:flex;align-items:center;justify-content:center;gap:7px;padding-top:18px}
  .ncc-dot{width:7px;height:7px;border-radius:50%;border:none;cursor:pointer;background:var(--border);
    transition:all .2s;padding:0}
  .ncc-dot.active{background:var(--red);width:20px;border-radius:3px}
`

const PAGE_SIZE = 3

export function NoticiasClubCarrossel({ items }: { items: NoticiaClube[] }) {
  const [page, setPage] = useState(0)
  const [pausado, setPausado] = useState(false)
  const totalPages = Math.ceil(items.length / PAGE_SIZE)

  const next = useCallback(() => setPage((p) => (p + 1) % totalPages), [totalPages])

  useEffect(() => {
    if (pausado || totalPages <= 1) return
    const t = setInterval(next, 5000)
    return () => clearInterval(t)
  }, [pausado, next, totalPages])

  if (items.length === 0) return null

  const visible = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <section className="ncc">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="container">
        <div className="ncc-header">
          <h2>Notícias do Clube</h2>
          <Link href="/noticias">Ver publicações</Link>
        </div>

        <div
          className="ncc-track-wrap"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
        >
          <div className="ncc-track">
            {visible.map((n) => {
              const grad = CORES[n.categoria] ?? CORES["Notícia"]
              return (
                <Link href="/noticias" className="ncc-card" key={n.id}>
                  <div className="ncc-bg">
                    {n.imagemUrl ? (
                      <Image src={n.imagemUrl} alt={n.titulo} fill style={{ objectFit: "cover" }} />
                    ) : null}
                    <div className="ncc-bg-grad" style={{ background: n.imagemUrl ? "linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 60%)" : grad }} />
                  </div>
                  {!n.imagemUrl && <div className="ncc-pattern" />}
                  {!n.imagemUrl && (
                    <div className="ncc-logo">
                      <Image src="/logo.png" alt="" width={56} height={56} aria-hidden />
                    </div>
                  )}
                  <div className="ncc-overlay">
                    <div className="ncc-badge">{n.categoria}</div>
                    <div className="ncc-titulo">{n.titulo}</div>
                    {n.subtitulo && <div className="ncc-sub">{n.subtitulo}</div>}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="ncc-dots">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={"ncc-dot" + (i === page ? " active" : "")} onClick={() => setPage(i)} aria-label={`Página ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
