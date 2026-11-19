"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { hrefNoticia } from "@/lib/noticias/conteudo"
import { BotaoPausar, useAutoplay } from "./autoplay"
import "./noticias-clube-carrossel.css"

export interface NoticiaClube {
  id: number
  titulo: string
  subtitulo: string | null
  categoria: string
  imagemUrl: string | null
  slug?: string | null
}

const CORES: Record<string, string> = {
  "Resultado":   "var(--success-600)",
  "Conquista":   "#0B0B0B",
  "Convocação":  "#0B0B0B",
  "Evento":      "#0B0B0B",
  "Comunicado":  "#0B0B0B",
  "Notícia":     "#0B0B0B",
}

const PAGE_SIZE = 3

export function NoticiasClubCarrossel({ items }: { items: NoticiaClube[] }) {
  const [page, setPage] = useState(0)
  const [pausado, setPausado] = useState(false)
  const totalPages = Math.ceil(items.length / PAGE_SIZE)

  const next = useCallback(() => setPage((p) => (p + 1) % totalPages), [totalPages])

  const { pausadoPeloUsuario, movimentoReduzido, alternarPausa } = useAutoplay({
    ativo: !pausado && totalPages > 1,
    intervaloMs: 5000,
    avancar: next,
  })

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
                <Link href={hrefNoticia(n.slug)} className="ncc-card" key={n.id}>
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
            <BotaoPausar
              pausado={pausadoPeloUsuario}
              onAlternar={alternarPausa}
              oculto={movimentoReduzido}
              rotulo="a troca automática de notícias"
            />
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={"ncc-dot" + (i === page ? " active" : "")} onClick={() => setPage(i)} aria-label={`Página ${i + 1}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
