"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ExternalLink } from "lucide-react"
import {
  MATERIAS_ABAS,
  materiasPorAba,
  type MateriaAbaId,
  type MateriaCard,
} from "@/lib/landing/materias"
import type { NoticiaClube } from "./noticias-clube-carrossel"
import "./materias-tabs.css"

function PublicacaoCard({ n }: { n: NoticiaClube }) {
  return (
    <Link href="/noticias/publico" className="mt-card mt-card-pub">
      <div className="mt-card-media">
        {n.imagemUrl ? (
          <Image src={n.imagemUrl} alt="" fill sizes="(max-width:700px) 100vw, 40vw" style={{ objectFit: "cover" }} />
        ) : (
          <div className="mt-card-fallback">
            <Image src="/logo.png" alt="" width={48} height={48} />
          </div>
        )}
      </div>
      <div className="mt-card-body">
        <span className="mt-badge">{n.categoria}</span>
        <h3 className="mt-card-title">{n.titulo}</h3>
        {n.subtitulo && <p className="mt-card-resumo">{n.subtitulo}</p>}
        <span className="mt-card-link">
          Ler publicação
          <ArrowRight size={14} aria-hidden />
        </span>
      </div>
    </Link>
  )
}

function MateriaItem({ m }: { m: MateriaCard }) {
  const body = (
    <>
      <div className="mt-card-media">
        {m.imagem ? (
          <Image
            src={m.imagem}
            alt=""
            fill
            sizes="(max-width:700px) 100vw, 40vw"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="mt-card-fallback">
            <Image src="/logo.png" alt="" width={48} height={48} />
          </div>
        )}
        {m.periodo && <span className="mt-period">{m.periodo}</span>}
      </div>
      <div className="mt-card-body">
        <div className="mt-meta-row">
          <span className="mt-badge">{m.badge}</span>
          {m.fonte && <span className="mt-fonte">{m.fonte}</span>}
        </div>
        <h3 className="mt-card-title">{m.titulo}</h3>
        <p className="mt-card-resumo">{m.resumo}</p>
        {m.href && (
          <span className="mt-card-link">
            {m.externo ? "Abrir matéria" : "Ver mais"}
            {m.externo ? (
              <ExternalLink size={14} aria-hidden />
            ) : (
              <ArrowRight size={14} aria-hidden />
            )}
          </span>
        )}
      </div>
    </>
  )

  if (m.href && m.externo) {
    return (
      <a
        href={m.href}
        className="mt-card"
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
      </a>
    )
  }
  if (m.href) {
    return (
      <Link href={m.href} className="mt-card">
        {body}
      </Link>
    )
  }
  return <article className="mt-card mt-card-static">{body}</article>
}

export function MateriasTabs({
  publicacoes = [],
}: {
  /** Notícias do admin (publicadas) — aba extra */
  publicacoes?: NoticiaClube[]
}) {
  const abas = useMemo(() => {
    const base = [...MATERIAS_ABAS]
    if (publicacoes.length > 0) {
      base.push({ id: "publicacoes", label: "Publicações" })
    }
    return base
  }, [publicacoes.length])

  const [aba, setAba] = useState<MateriaAbaId>("destaques")
  const tabsRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    if (aba === "publicacoes") return null
    return materiasPorAba(aba)
  }, [aba])

  useEffect(() => {
    const root = tabsRef.current
    if (!root) return
    const active = root.querySelector<HTMLElement>(".mt-tab.active")
    active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [aba])

  // Se publicações sumirem e a aba estiver nela, volta para destaques
  useEffect(() => {
    if (aba === "publicacoes" && publicacoes.length === 0) setAba("destaques")
  }, [aba, publicacoes.length])

  return (
    <section className="mt" id="materias" aria-labelledby="mt-heading">
      <div className="container mt-inner">
        <div className="mt-header">
          <div>
            <p className="mt-kicker">Clube &amp; base</p>
            <h2 id="mt-heading">Notícias e conquistas</h2>
            <p className="mt-lead">
              Mundial, títulos paulistas, participações e o legado de formação do Elite
              Itaquerense.
            </p>
          </div>
          <Link href="/noticias/publico" className="mt-more">
            Todas as publicações
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        <div className="mt-tabs-bar" ref={tabsRef}>
          <div className="mt-tabs" role="tablist" aria-label="Tipo de matéria">
            {abas.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`mt-tab-${t.id}`}
                aria-selected={aba === t.id}
                aria-controls="mt-panel"
                className={"mt-tab" + (aba === t.id ? " active" : "")}
                onClick={() => setAba(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div
          id="mt-panel"
          role="tabpanel"
          aria-labelledby={`mt-tab-${aba}`}
          className="mt-panel"
        >
          {aba === "publicacoes" ? (
            publicacoes.length > 0 ? (
              <div className="mt-grid">
                {publicacoes.map((n) => (
                  <PublicacaoCard key={n.id} n={n} />
                ))}
              </div>
            ) : (
              <p className="mt-empty">Nenhuma publicação no momento.</p>
            )
          ) : items && items.length > 0 ? (
            <div className="mt-grid">
              {items.map((m) => (
                <MateriaItem key={m.id} m={m} />
              ))}
            </div>
          ) : (
            <p className="mt-empty">Nenhuma matéria nesta aba.</p>
          )}
        </div>
      </div>
    </section>
  )
}
