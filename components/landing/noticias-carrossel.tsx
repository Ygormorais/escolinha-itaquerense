"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import type { CategoriaNoticias, NoticiaCard } from "@/lib/landing/noticias"
import "./noticias-carrossel.css"

function statusMeta(r: NoticiaCard["resultado"]): { text: string; tone: string } {
  switch (r) {
    case "Vitoria":
      return { text: "Vitória", tone: "win" }
    case "Derrota":
      return { text: "Derrota", tone: "loss" }
    case "Empate":
      return { text: "Empate", tone: "draw" }
    case "Proximo":
      return { text: "Próximo jogo", tone: "next" }
    default:
      return { text: "Clube", tone: "next" }
  }
}

function splitPlacar(placar: string | null): [string, string] | null {
  if (!placar) return null
  const parts = placar.split(/\s*[×xX\-–]\s*/)
  if (parts.length < 2) return null
  return [parts[0].trim(), parts[1].trim()]
}

function awayInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "ADV"
}

/** Local serve direto; externo via proxy (anti-hotlink). */
function escudoSrc(url: string): string {
  if (url.startsWith("/")) return url
  return `/api/escudo?u=${encodeURIComponent(url)}`
}

/**
 * Tenta cada URL candidata (clube conhecido na web → FPFS).
 * Se todas falharem, monograma com iniciais.
 */
function AwayCrest({ urls, name }: { urls: string[]; name: string }) {
  const [idx, setIdx] = useState(0)
  const list = urls ?? []
  const current = list[idx] ?? null

  if (!current) {
    return (
      <div className="nc-crest nc-crest-away" aria-hidden>
        <span>{awayInitials(name)}</span>
      </div>
    )
  }

  return (
    <div className="nc-crest nc-crest-photo" title={name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current}
        src={escudoSrc(current)}
        alt={`Escudo ${name}`}
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  )
}

export function NoticiasCarrossel({
  grupos,
  items: itemsLegado,
}: {
  /** Preferido: abas por categoria (Sub-7…Sub-18). */
  grupos?: CategoriaNoticias[] | null
  /** Legado: lista plana (vira um único grupo). */
  items?: NoticiaCard[] | null
}) {
  const [catIdx, setCatIdx] = useState(0)
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const gruposSafe = useMemo((): CategoriaNoticias[] => {
    if (Array.isArray(grupos) && grupos.length > 0) return grupos
    if (Array.isArray(itemsLegado) && itemsLegado.length > 0) {
      return [{ categoria: "Jogos", items: itemsLegado }]
    }
    return []
  }, [grupos, itemsLegado])

  const catSegura = Math.min(catIdx, Math.max(0, gruposSafe.length - 1))
  const items = useMemo(
    () => gruposSafe[catSegura]?.items ?? [],
    [gruposSafe, catSegura],
  )

  // Ao trocar de categoria, centra a aba ativa
  useEffect(() => {
    const root = tabsRef.current
    if (!root) return
    const active = root.querySelector<HTMLElement>(".nc-tab.active")
    if (!active) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    active.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    })
  }, [catSegura])

  const prev = useCallback(
    () => setAtivo((i) => (items.length ? (i - 1 + items.length) % items.length : 0)),
    [items.length],
  )
  const next = useCallback(
    () => setAtivo((i) => (items.length ? (i + 1) % items.length : 0)),
    [items.length],
  )

  useEffect(() => {
    if (pausado || items.length <= 1) return
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const t = setInterval(next, 6000)
    return () => clearInterval(t)
  }, [pausado, next, items.length])

  useEffect(() => {
    if (items.length <= 1) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [items.length, prev, next])

  if (gruposSafe.length === 0 || items.length === 0) return null

  const item = items[Math.min(ativo, Math.max(0, items.length - 1))]
  if (!item) return null

  const status = statusMeta(item.resultado)
  const goals = splitPlacar(item.placar)
  const casa = item.casa || "Itaquerense"
  const fora = item.fora || "Adversário"
  const nosCasa = item.nosCasa !== false
  const advEscudos = item.foraEscudos ?? []

  const homeCrest = nosCasa ? (
    <div className="nc-crest nc-crest-home">
      <Image src="/logo.png" alt="" width={56} height={56} />
    </div>
  ) : (
    <AwayCrest urls={advEscudos} name={casa} />
  )
  const awayCrest = nosCasa ? (
    <AwayCrest urls={advEscudos} name={fora} />
  ) : (
    <div className="nc-crest nc-crest-home">
      <Image src="/logo.png" alt="" width={56} height={56} />
    </div>
  )

  const cardInner = (
    <>
      <div className="nc-bar">
        <span className="nc-comp">{item.badge}</span>
        <span className={`nc-status nc-status-${status.tone}`}>{status.text}</span>
      </div>

      <div className="nc-stage" aria-label={item.titulo}>
        <div className="nc-club">
          {homeCrest}
          <span className="nc-club-name">{casa}</span>
          <span className="nc-club-role">Casa</span>
        </div>

        <div className="nc-center">
          {goals ? (
            <div className="nc-scoreline">
              <span className="nc-goal">{goals[0]}</span>
              <span className="nc-dash" aria-hidden>
                –
              </span>
              <span className="nc-goal">{goals[1]}</span>
            </div>
          ) : (
            <div className="nc-vs-badge">VS</div>
          )}
          <p className="nc-when">{item.subtitulo}</p>
        </div>

        <div className="nc-club">
          {awayCrest}
          <span className="nc-club-name">{fora}</span>
          <span className="nc-club-role">Visitante</span>
        </div>
      </div>

      <div className="nc-actions">
        {item.externo ? (
          <span className="nc-action-primary">
            Ver súmula na FPFS
            <ExternalLink size={14} aria-hidden />
          </span>
        ) : (
          <span className="nc-action-primary">
            Ver detalhes
            <ArrowRight size={14} aria-hidden />
          </span>
        )}
        {items.length > 1 && (
          <span className="nc-counter" aria-hidden>
            {Math.min(ativo, items.length - 1) + 1} / {items.length}
          </span>
        )}
      </div>
    </>
  )

  return (
    <section className="nc" aria-labelledby="nc-heading">
      <div className="container nc-inner">
        <div className="nc-header">
          <div>
            <h2 id="nc-heading">Jogos e resultados</h2>
          </div>
          <Link href="/resultados" className="nc-more">
            Ver todos
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        {/* Abas finas estilo PL/ESPN — só texto + underline */}
        {gruposSafe.length > 1 && (
          <div className="nc-tabs-bar" ref={tabsRef}>
            <div className="nc-tabs" role="tablist" aria-label="Categoria">
              {gruposSafe.map((g, i) => (
                <button
                  key={g.categoria}
                  type="button"
                  role="tab"
                  id={`nc-tab-${g.categoria}`}
                  aria-selected={i === catSegura}
                  aria-controls="nc-panel"
                  className={"nc-tab" + (i === catSegura ? " active" : "")}
                  onClick={() => {
                    setCatIdx(i)
                    setAtivo(0)
                  }}
                >
                  {g.categoria}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          id="nc-panel"
          role="tabpanel"
          aria-labelledby={
            gruposSafe[catSegura]
              ? `nc-tab-${gruposSafe[catSegura].categoria}`
              : undefined
          }
          className={`nc-feature nc-feature-${status.tone}`}
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0]?.clientX ?? null
            setPausado(true)
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current
            touchStartX.current = null
            setPausado(false)
            if (start == null || items.length <= 1) return
            const dx = (e.changedTouches[0]?.clientX ?? start) - start
            if (Math.abs(dx) < 48) return
            if (dx < 0) next()
            else prev()
          }}
        >
          {items.length > 1 && (
            <>
              <button
                type="button"
                className="nc-arrow nc-arrow-prev"
                onClick={prev}
                aria-label="Jogo anterior"
              >
                <ChevronLeft size={22} aria-hidden />
              </button>
              <button
                type="button"
                className="nc-arrow nc-arrow-next"
                onClick={next}
                aria-label="Próximo jogo"
              >
                <ChevronRight size={22} aria-hidden />
              </button>
            </>
          )}

          {item.externo ? (
            <a
              href={item.href}
              className="nc-feature-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {cardInner}
            </a>
          ) : (
            <Link href={item.href} className="nc-feature-link">
              {cardInner}
            </Link>
          )}
        </div>

        {items.length > 1 && (
          <div className="nc-controls">
            <button
              type="button"
              className="nc-ctrl nc-ctrl-prev"
              onClick={prev}
              aria-label="Jogo anterior"
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
            <div className="nc-dots" role="tablist" aria-label="Selecionar jogo">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  type="button"
                  role="tab"
                  aria-selected={i === ativo}
                  className={"nc-dot" + (i === ativo ? " active" : "")}
                  onClick={() => setAtivo(i)}
                  aria-label={`${it.casa} versus ${it.fora}`}
                />
              ))}
            </div>
            <button
              type="button"
              className="nc-ctrl nc-ctrl-next"
              onClick={next}
              aria-label="Próximo jogo"
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
