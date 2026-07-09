"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import "./noticias-clube-carrossel.css"

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

      <div className="container">
        <div className="ncc-header">
          <h2>Notícias do Clube</h2>
          <Link href="/noticias/publico">Ver publicações</Link>
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
                <Link href="/noticias/publico" className="ncc-card" key={n.id}>
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
