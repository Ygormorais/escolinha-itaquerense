"use client"

import { useCallback, useRef, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { HeroSlide } from "@/lib/landing/hero"

const SWIPE_MIN_PX = 48

/**
 * Hero em tela cheia com abas, no estilo dos portais de clube. Sem autoplay: o movimento
 * acontece só quando a pessoa pede (setas, abas, teclado ou deslize). Slides sem foto
 * usam o campo de listras alvirrubras com o escudo; com foto, a foto vira o fundo.
 */
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [atual, setAtual] = useState(0)
  const toqueX = useRef<number | null>(null)
  const total = slides.length

  const ir = useCallback((destino: number) => setAtual(((destino % total) + total) % total), [total])

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") ir(atual - 1)
    if (e.key === "ArrowRight") ir(atual + 1)
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (toqueX.current === null) return
    const delta = e.changedTouches[0].clientX - toqueX.current
    toqueX.current = null
    if (Math.abs(delta) >= SWIPE_MIN_PX) ir(delta < 0 ? atual + 1 : atual - 1)
  }

  return (
    <section
      className="hs"
      aria-roledescription="carousel"
      aria-label="Destaques do clube"
      onKeyDown={onKeyDown}
    >
      <div
        className="hs-viewport"
        onTouchStart={(e) => { toqueX.current = e.touches[0].clientX }}
        onTouchEnd={onTouchEnd}
      >
        <div className="hs-track" style={{ transform: `translateX(-${atual * 100}%)` }}>
          {slides.map((s, i) => {
            const Titulo = i === 0 ? "h1" : "h2"
            return (
              <article
                key={s.id}
                className="hs-slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${total}`}
                inert={i !== atual}
              >
                {s.imagem ? (
                  <>
                    <Image
                      className="hs-photo"
                      src={s.imagem}
                      alt=""
                      fill
                      sizes="100vw"
                      priority={i === 0}
                      style={{ objectFit: "cover" }}
                    />
                    <div className="hs-shade hs-shade-photo" aria-hidden />
                  </>
                ) : (
                  <>
                    <div className="hs-field" aria-hidden />
                    <Image
                      className="hs-crest"
                      src="/logo.png"
                      alt=""
                      width={680}
                      height={680}
                      sizes="(max-width: 900px) 70vw, 680px"
                      priority={i === 0}
                      aria-hidden
                    />
                    <div className="hs-shade" aria-hidden />
                  </>
                )}

                <div className="container hs-copy">
                  <div className="hs-text">
                    <p className="hs-kicker">{s.kicker}</p>
                    <Titulo className={"hs-title" + (s.titulo.length > 42 ? " is-long" : "")}>{s.titulo}</Titulo>
                    {s.descricao && <p className="hs-desc">{s.descricao}</p>}
                    <a href={s.cta.href} className="hs-cta" {...(s.cta.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {s.cta.label}
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <div className="hs-bar">
        <div className="container hs-bar-row">
          <div className="hs-tabs">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className="hs-tab"
                aria-current={i === atual ? "true" : undefined}
                aria-label={`Ir para o destaque ${i + 1}: ${s.aba}`}
                onClick={() => ir(i)}
              >
                <span className="hs-tab-label">{s.aba}</span>
              </button>
            ))}
          </div>
          <div className="hs-arrows">
            <button type="button" className="hs-arrow" aria-label="Destaque anterior" onClick={() => ir(atual - 1)}>
              <ChevronLeft size={22} strokeWidth={2.25} aria-hidden />
            </button>
            <button type="button" className="hs-arrow" aria-label="Próximo destaque" onClick={() => ir(atual + 1)}>
              <ChevronRight size={22} strokeWidth={2.25} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
