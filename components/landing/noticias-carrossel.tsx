"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import type { NoticiaCard } from "@/lib/landing/noticias"

const GRAD: Record<string, string> = {
  Vitoria:       "linear-gradient(140deg,#0D3B12 0%,#1B5E20 45%,#2E7D32 100%)",
  Derrota:       "linear-gradient(140deg,#3B0000 0%,#7F0000 50%,#B71C1C 100%)",
  Empate:        "linear-gradient(140deg,#0D0D2B 0%,#1A1A2E 50%,#2D2D4E 100%)",
  Proximo:       "linear-gradient(140deg,#4A0B0B 0%,#C62828 60%,#D84040 100%)",
  Institucional: "linear-gradient(140deg,#1A1A2E 0%,#C62828 100%)",
}

const css = `
  .nc{background:var(--bg-muted);padding:0}
  .nc .container{max-width:1060px;margin:0 auto;padding:0 24px}
  .nc-inner{padding:56px 0 48px}

  /* header */
  .nc-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
  .nc-header h2{font-family:var(--font-heading),Georgia,serif;font-size:28px;font-weight:800;
    color:var(--text);letter-spacing:-.5px}
  .nc-header a{font-size:13px;font-weight:600;color:var(--red);display:flex;align-items:center;gap:5px;
    transition:opacity .2s}
  .nc-header a:hover{opacity:.75}

  /* card */
  .nc-card-wrap{border-radius:20px;overflow:hidden;position:relative;height:440px;
    box-shadow:0 16px 48px rgba(26,26,46,.18);transition:box-shadow .3s}
  .nc-card-wrap:hover{box-shadow:0 24px 64px rgba(26,26,46,.24)}
  .nc-bg{position:absolute;inset:0;transition:opacity .5s}
  .nc-pattern{position:absolute;inset:0;
    background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,.05)' stroke-width='1'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3Cline x1='0' y1='30' x2='60' y2='30'/%3E%3Cline x1='30' y1='0' x2='30' y2='60'/%3E%3C/g%3E%3C/svg%3E");
    background-size:60px 60px}
  .nc-deco-circle{position:absolute;right:-80px;top:-80px;width:360px;height:360px;border-radius:50%;
    background:radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)}
  .nc-deco-circle2{position:absolute;left:-60px;bottom:-60px;width:240px;height:240px;border-radius:50%;
    background:radial-gradient(circle,rgba(255,255,255,.05) 0%,transparent 70%)}

  /* logo center */
  .nc-logo-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
  .nc-logo-wrap img{width:88px;height:88px;object-fit:contain;filter:drop-shadow(0 4px 20px rgba(0,0,0,.4));
    opacity:.35}

  /* bottom overlay */
  .nc-overlay{position:absolute;bottom:0;left:0;right:0;
    background:linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.5) 50%,transparent 100%);
    padding:28px 32px 32px}
  .nc-badge{display:inline-flex;align-items:center;gap:6px;
    background:rgba(255,255,255,.15);color:rgba(255,255,255,.9);
    font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
    padding:5px 12px;border-radius:100px;border:1px solid rgba(255,255,255,.2);margin-bottom:12px}
  .nc-titulo{font-family:var(--font-heading),Georgia,serif;font-size:28px;font-weight:800;
    color:#fff;line-height:1.15;letter-spacing:-.3px;margin-bottom:8px;
    text-shadow:0 2px 8px rgba(0,0,0,.4)}
  .nc-subtitulo{font-size:13px;color:rgba(255,255,255,.75);font-weight:500}

  /* resultado pill */
  .nc-result-pill{position:absolute;top:24px;right:24px;display:flex;align-items:center;gap:6px;
    background:rgba(0,0,0,.5);backdrop-filter:blur(8px);
    border:1px solid rgba(255,255,255,.15);border-radius:100px;
    padding:6px 14px;font-size:11px;font-weight:700;letter-spacing:1px;
    text-transform:uppercase;color:#fff}
  .nc-pill-v{background:rgba(27,94,32,.8);border-color:rgba(76,175,80,.4)}
  .nc-pill-d{background:rgba(127,0,0,.8);border-color:rgba(183,28,28,.4)}
  .nc-pill-e{background:rgba(26,26,46,.8);border-color:rgba(61,61,110,.4)}
  .nc-pill-p{background:rgba(198,40,40,.8);border-color:rgba(216,64,64,.4)}

  /* nav arrows */
  .nc-arrow{position:absolute;top:50%;transform:translateY(-50%);
    background:rgba(0,0,0,.5);backdrop-filter:blur(6px);
    border:1px solid rgba(255,255,255,.15);border-radius:50%;
    width:44px;height:44px;display:flex;align-items:center;justify-content:center;
    cursor:pointer;color:#fff;font-size:18px;transition:all .2s;z-index:10}
  .nc-arrow:hover{background:rgba(0,0,0,.75);border-color:rgba(255,255,255,.35)}
  .nc-arrow-prev{left:16px}
  .nc-arrow-next{right:16px}

  /* dots */
  .nc-dots{display:flex;align-items:center;justify-content:center;gap:8px;padding-top:20px}
  .nc-dot{width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;
    background:var(--border);transition:all .22s;padding:0}
  .nc-dot.active{background:var(--red);width:24px;border-radius:4px}

  @media(max-width:640px){
    .nc-card-wrap{height:320px}
    .nc-titulo{font-size:20px}
    .nc-overlay{padding:20px 20px 24px}
    .nc-logo-wrap img{width:64px;height:64px}
    .nc-arrow{display:none}
  }
`

export function NoticiasCarrossel({ items }: { items: NoticiaCard[] }) {
  const [ativo, setAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)

  const prev = useCallback(() => setAtivo((i) => (i - 1 + items.length) % items.length), [items.length])
  const next = useCallback(() => setAtivo((i) => (i + 1) % items.length), [items.length])

  useEffect(() => {
    if (pausado || items.length <= 1) return
    const t = setInterval(next, 5500)
    return () => clearInterval(t)
  }, [pausado, next, items.length])

  if (items.length === 0) return null

  const item = items[ativo]
  const grad = GRAD[item.resultado] ?? GRAD.Institucional

  const pilulas: Record<string, { label: string; cls: string; icon: string }> = {
    Vitoria:       { label: "Vitória",    cls: "nc-pill-v", icon: "ti-trophy" },
    Derrota:       { label: "Derrota",    cls: "nc-pill-d", icon: "ti-flag-x" },
    Empate:        { label: "Empate",     cls: "nc-pill-e", icon: "ti-equal" },
    Proximo:       { label: "Em breve",   cls: "nc-pill-p", icon: "ti-calendar-event" },
    Institucional: { label: "Itaquerense", cls: "nc-pill-p", icon: "ti-ball-football" },
  }
  const pill = pilulas[item.resultado]

  return (
    <section className="nc">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="container nc-inner">

        <div className="nc-header">
          <h2>Destaques</h2>
          <Link href="/resultados">
            Ver todos <i className="ti ti-arrow-right"></i>
          </Link>
        </div>

        <div
          className="nc-card-wrap"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
        >
          {/* BG */}
          <div className="nc-bg" style={{ background: grad }} />
          <div className="nc-pattern" />
          <div className="nc-deco-circle" />
          <div className="nc-deco-circle2" />

          {/* Logo watermark */}
          <div className="nc-logo-wrap">
            <Image src="/logo.png" alt="" width={88} height={88} aria-hidden />
          </div>

          {/* Resultado pill */}
          <div className={`nc-result-pill ${pill.cls}`}>
            <i className={`ti ${pill.icon}`}></i>
            {pill.label}
          </div>

          {/* Setas */}
          {items.length > 1 && (
            <>
              <button className="nc-arrow nc-arrow-prev" onClick={prev} aria-label="Anterior">
                <i className="ti ti-chevron-left"></i>
              </button>
              <button className="nc-arrow nc-arrow-next" onClick={next} aria-label="Próximo">
                <i className="ti ti-chevron-right"></i>
              </button>
            </>
          )}

          {/* Conteúdo */}
          <Link href={item.href} className="nc-overlay" style={{ display: "block", textDecoration: "none" }}>
            <div className="nc-badge">
              <i className="ti ti-news"></i>
              {item.badge}
            </div>
            <div className="nc-titulo">{item.titulo}</div>
            <div className="nc-subtitulo">{item.subtitulo}</div>
          </Link>
        </div>

        {/* Dots */}
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
