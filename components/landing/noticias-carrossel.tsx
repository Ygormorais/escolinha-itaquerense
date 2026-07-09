"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Equal,
  ExternalLink,
  Flag,
  Newspaper,
  Trophy,
} from "lucide-react"
import type { NoticiaCard } from "@/lib/landing/noticias"
import "./noticias-carrossel.css"

const GRAD: Record<string, string> = {
  Vitoria:       "linear-gradient(140deg,#0D3B12 0%,#1B5E20 45%,#2E7D32 100%)",
  Derrota:       "linear-gradient(140deg,#3B0000 0%,#7F0000 50%,#B71C1C 100%)",
  Empate:        "linear-gradient(140deg,#2A221C 0%,#4A3F38 50%,#6B5E54 100%)",
  Proximo:       "linear-gradient(140deg,#4A0B0B 0%,#C62828 60%,#D84040 100%)",
  Institucional: "linear-gradient(140deg,#3B1A1A 0%,#C62828 100%)",
}

export function NoticiasCarrossel({ items }: { items: NoticiaCard[] }) {
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)

  const prev = useCallback(() => setAtivo((i) => (i - 1 + items.length) % items.length), [items.length])
  const next = useCallback(() => setAtivo((i) => (i + 1) % items.length), [items.length])

  useEffect(() => {
    if (pausado || items.length <= 1) return
    const reduce = typeof window !== "undefined"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [pausado, next, items.length])

  useEffect(() => {
    if (items.length <= 1) return
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [items.length, prev, next])

  if (items.length === 0) return null

  const item = items[ativo]
  const grad = GRAD[item.resultado] ?? GRAD.Institucional

  const pilulas: Record<string, { label: string; cls: string; icon: ReactNode }> = {
    Vitoria:       { label: "Vitória",     cls: "nc-pill-v", icon: <Trophy size={14} aria-hidden /> },
    Derrota:       { label: "Derrota",     cls: "nc-pill-d", icon: <Flag size={14} aria-hidden /> },
    Empate:        { label: "Empate",      cls: "nc-pill-e", icon: <Equal size={14} aria-hidden /> },
    Proximo:       { label: "Em breve",    cls: "nc-pill-p", icon: <Calendar size={14} aria-hidden /> },
    Institucional: { label: "Itaquerense", cls: "nc-pill-p", icon: <Trophy size={14} aria-hidden /> },
  }
  const pill = pilulas[item.resultado] ?? pilulas.Institucional

  return (
    <section className="nc">
      <div className="container nc-inner">

        <div className="nc-header">
          <h2>Jogos e resultados</h2>
          <Link href="/resultados">
            Resultados no site <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        <div
          className="nc-card-wrap"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
        >
          <div className="nc-bg" style={{ background: grad }} />
          <div className="nc-pattern" />
          <div className="nc-deco-circle" />
          <div className="nc-deco-circle2" />

          <div className="nc-logo-wrap">
            <Image src="/logo.png" alt="" width={88} height={88} aria-hidden />
          </div>

          <div className={`nc-result-pill ${pill.cls}`}>
            {pill.icon}
            {pill.label}
          </div>

          {items.length > 1 && (
            <>
              <button className="nc-arrow nc-arrow-prev" onClick={prev} aria-label="Anterior">
                <ChevronLeft size={20} aria-hidden />
              </button>
              <button className="nc-arrow nc-arrow-next" onClick={next} aria-label="Próximo">
                <ChevronRight size={20} aria-hidden />
              </button>
            </>
          )}

          {item.externo ? (
            <a
              href={item.href}
              className="nc-overlay"
              style={{ display: "block", textDecoration: "none" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="nc-badge">
                <Trophy size={12} aria-hidden />
                {item.badge}
              </div>
              <div className="nc-titulo">{item.titulo}</div>
              <div className="nc-subtitulo">{item.subtitulo}</div>
              <span className="nc-ext">
                Abrir na FPFS <ExternalLink size={12} aria-hidden />
              </span>
            </a>
          ) : (
            <Link href={item.href} className="nc-overlay" style={{ display: "block", textDecoration: "none" }}>
              <div className="nc-badge">
                <Newspaper size={12} aria-hidden />
                {item.badge}
              </div>
              <div className="nc-titulo">{item.titulo}</div>
              <div className="nc-subtitulo">{item.subtitulo}</div>
            </Link>
          )}
        </div>

        {items.length > 1 && (
          <div className="nc-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={"nc-dot" + (i === ativo ? " active" : "")}
                onClick={() => setAtivo(i)}
                aria-label={`Item ${i + 1}`}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  )
}
