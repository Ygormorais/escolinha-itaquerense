"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Lock, Menu, X, ChevronLeft, ChevronRight } from "lucide-react"
import { NoticiasCarrossel } from "./noticias-carrossel"
import { MateriasTabs } from "./materias-tabs"
import type { HeroView } from "@/lib/landing/jogos"
import type { CategoriaNoticias } from "@/lib/landing/noticias"
import type { NoticiaClube } from "./noticias-clube-carrossel"
import type { SobreConteudo, FotoGaleria, Depoimento } from "@/lib/landing/conteudo"
import { marcos } from "@/lib/landing/conteudo"
import { publicFontClass } from "@/lib/public-fonts"
import "./landing.css"

/** Asset real do clube — hero com foto (não stock). */
const HERO_BG = "/landing/galeria/sede-elite.webp"

export function LandingClient({
  jogosPorCategoria,
  noticiasClube,
  whatsapp,
  hero,
  sobre,
  galeria,
  depoimentos,
  endereco,
  cidade,
}: {
  /** Jogos/resultados agrupados por Sub (abas no carrossel). */
  jogosPorCategoria: CategoriaNoticias[]
  noticiasClube: NoticiaClube[]
  whatsapp?: string
  hero: HeroView
  sobre: SobreConteudo | null
  galeria: FotoGaleria[]
  depoimentos: Depoimento[]
  endereco?: string
  cidade?: string
}) {
  const [navOpen, setNavOpen] = useState(false)
  const [lbIndex, setLbIndex] = useState<number | null>(null)
  const closeNav = () => setNavOpen(false)
  const closeLb = () => setLbIndex(null)

  useEffect(() => {
    if (!navOpen && lbIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNavOpen(false)
        setLbIndex(null)
      }
      if (lbIndex !== null && galeria.length > 0) {
        if (e.key === "ArrowLeft") setLbIndex((i) => (i === null ? i : (i - 1 + galeria.length) % galeria.length))
        if (e.key === "ArrowRight") setLbIndex((i) => (i === null ? i : (i + 1) % galeria.length))
      }
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [navOpen, lbIndex, galeria.length])

  const waNumber = whatsapp?.replace(/\D/g, "") || ""
  const waUrl = waNumber.length >= 10
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Olá! Gostaria de mais informações sobre a Escolinha Itaquerense.")}`
    : null

  return (
    <div className={`${publicFontClass} lp`}>
      <a className="skip-link" href="#conteudo-principal">Ir para o conteúdo</a>

      <header className="site">
        <div className="container header-row">
          <Link className="brand" href="/" onClick={closeNav}>
            <Image className="shield" src="/logo.png" alt="E.C. Itaquerense" width={52} height={52} />
            <span className="name"><b>E.C. Itaquerense</b><span>Site Oficial</span></span>
          </Link>

          <div className="access">
            <a href="/matricula" className="btn-access primary">Matrícula</a>
            <a href="/responsavel" className="btn-access">
              <span className="btn-full">Portal da família</span>
              <span className="btn-short">Portal</span>
            </a>
          </div>

          <a
            href="/login"
            className="btn-staff"
            aria-label="Área da equipe — painel administrativo"
            title="Área da equipe"
          >
            <Lock size={16} strokeWidth={2} aria-hidden />
          </a>

          <button
            className="burger"
            aria-label={navOpen ? "Fechar menu" : "Menu"}
            aria-expanded={navOpen}
            aria-controls="nav"
            onClick={() => setNavOpen((o) => !o)}
          >
            {navOpen ? <X size={26} strokeWidth={2} aria-hidden /> : <Menu size={26} strokeWidth={2} aria-hidden />}
          </button>

          <nav className={"main" + (navOpen ? " open" : "")} id="nav">
            <ul>
              <li><a href="/horarios" onClick={closeNav}>Turmas</a></li>
              <li><a href="/resultados" onClick={closeNav}>Resultados</a></li>
              <li><a href="#materias" onClick={closeNav}>Notícias</a></li>
              <li><a href="#sobre" onClick={closeNav}>História</a></li>
              <li><a href="#galeria" onClick={closeNav}>Galeria</a></li>
              {depoimentos.length > 0 && (
                <li><a href="#voz" onClick={closeNav}>Voz do clube</a></li>
              )}
              <li className="nav-access"><a href="/responsavel" onClick={closeNav}>Portal da família</a></li>
            </ul>
          </nav>
        </div>
      </header>
      <button
        type="button"
        className={"nav-backdrop" + (navOpen ? " open" : "")}
        aria-label="Fechar menu"
        tabIndex={navOpen ? 0 : -1}
        onClick={closeNav}
      />

      <main id="conteudo-principal">
        <div className="hero">
          <Image
            className="hero-bg"
            src={HERO_BG}
            alt=""
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover", objectPosition: "center" }}
            aria-hidden
          />
          <div className="hero-overlay" aria-hidden />
          <div className="container">
            <span className="badge">{hero.badge}</span>
            <h1>{hero.titulo}</h1>
            <p>{hero.descricao}</p>
            {hero.ctaExterno ? (
              <a href={hero.ctaHref} className="btn btn-white" target="_blank" rel="noopener noreferrer">
                {hero.ctaLabel}
              </a>
            ) : (
              <a href={hero.ctaHref} className="btn btn-white">{hero.ctaLabel}</a>
            )}
          </div>
        </div>

        {marcos.length > 0 && (
          <section className="marcos" aria-label="Marcos do clube">
            <div className="container marcos-grid">
              {marcos.map((m) => (
                <div className="marcos-item" key={m.rotulo}>
                  <strong>{m.valor}</strong>
                  <span>{m.rotulo}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div id="noticias">
          <NoticiasCarrossel grupos={jogosPorCategoria ?? []} />
        </div>

        <MateriasTabs publicacoes={noticiasClube} />

        {sobre && sobre.paragrafos.length > 0 && (
          <section className="sobre" id="sobre">
            <div className="container" style={sobre.foto ? undefined : { display: "block", maxWidth: "760px" }}>
              <div className="txt">
                <h2 className="section-title">{sobre.titulo}</h2>
                {sobre.paragrafos.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {sobre.foto && (
                <div className="foto">
                  <Image src={sobre.foto} alt="Sede e identidade da Sociedade Esportiva Elite Itaquerense" width={560} height={420} />
                </div>
              )}
            </div>
          </section>
        )}

        {galeria.length > 0 && (
          <section className="galeria" id="galeria">
            <div className="container">
              <h2 className="section-title">Galeria</h2>
              <div className="grid">
                {galeria.map((f, i) => (
                  <button
                    type="button"
                    className="item"
                    key={i}
                    onClick={() => setLbIndex(i)}
                    aria-label={`Ampliar: ${f.alt}`}
                  >
                    <Image src={f.src} alt={f.alt} width={400} height={300} />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {depoimentos.length > 0 && (
          <section className="depo" id="voz">
            <div className="container">
              <h2 className="section-title">Voz do clube</h2>
              <div className={"grid" + (depoimentos.length === 1 ? " depo-grid-single" : "")}>
                {depoimentos.map((d, i) => (
                  <blockquote className="card" key={i}>
                    <div className="quote" aria-hidden="true">&ldquo;</div>
                    <p className="texto">{d.texto}</p>
                    <footer className="autor">
                      <b>{d.autor}</b>
                      {d.categoria && <span>{d.categoria}</span>}
                      {d.fonte && (
                        d.fonteUrl ? (
                          <a
                            className="fonte"
                            href={d.fonteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Fonte: {d.fonte}
                          </a>
                        ) : (
                          <span className="fonte">Fonte: {d.fonte}</span>
                        )
                      )}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="membership" id="matricule-se">
          <div className="container">
            <h2>Pronto para vestir o alvirrubro?</h2>
            <p>Faça a pré-matrícula da escolinha e acompanhe tudo pelo portal da família. Vagas por categoria — fale conosco se tiver dúvidas.</p>
            <div className="btn-row">
              <a href="/matricula" className="btn btn-white">Fazer pré-matrícula</a>
              {waUrl && (
                <a href={waUrl} className="btn btn-ghost-white" target="_blank" rel="noopener noreferrer">
                  Falar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container foot-grid">
          <div className="foot-brand">
            <Image className="shield" src="/logo.png" alt="E.C. Itaquerense" width={68} height={68} />
            <p>Sociedade Esportiva Elite Itaquerense — tradição alvirrubra em Itaquera desde 1922. Formação esportiva e humana para as novas gerações.</p>
          </div>
          <div className="fcol">
            <h4>Clube</h4>
            <a href="#materias">Notícias</a>
            <a href="#sobre">História</a>
            <a href="#galeria">Galeria</a>
            {depoimentos.length > 0 && <a href="#voz">Voz do clube</a>}
            <a href="/resultados">Resultados</a>
          </div>
          <div className="fcol">
            <h4>Escolinha</h4>
            <a href="/horarios">Turmas e horários</a>
            <a href="/matricula">Pré-matrícula</a>
            <a href="/responsavel">Portal da família</a>
          </div>
          <div className="fcol">
            <h4>Contato</h4>
            <div className="foot-addr">
              {endereco && <p>{endereco}</p>}
              {cidade && <p>{cidade}</p>}
              {waUrl && (
                <p style={{ marginTop: "8px" }}>
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <div className="container">
            <span>© 2026 Sociedade Esportiva Elite Itaquerense. Todos os direitos reservados.</span>
            <a href="/login" className="foot-staff" title="Acesso restrito à equipe administrativa">
              <Lock size={12} strokeWidth={2} aria-hidden />
              Área da equipe
            </a>
          </div>
        </div>
      </footer>

      {lbIndex !== null && galeria[lbIndex] && (
        <div className="lb" role="dialog" aria-modal="true" aria-label="Foto ampliada" onClick={closeLb}>
          <div className="lb-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lb-close" aria-label="Fechar" onClick={closeLb}>
              <X size={20} strokeWidth={2.5} aria-hidden />
            </button>
            {galeria.length > 1 && (
              <>
                <button
                  type="button"
                  className="lb-nav lb-prev"
                  aria-label="Foto anterior"
                  onClick={() => setLbIndex((i) => (i === null ? 0 : (i - 1 + galeria.length) % galeria.length))}
                >
                  <ChevronLeft size={22} strokeWidth={2} aria-hidden />
                </button>
                <button
                  type="button"
                  className="lb-nav lb-next"
                  aria-label="Próxima foto"
                  onClick={() => setLbIndex((i) => (i === null ? 0 : (i + 1) % galeria.length))}
                >
                  <ChevronRight size={22} strokeWidth={2} aria-hidden />
                </button>
              </>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={galeria[lbIndex].src} alt={galeria[lbIndex].alt} />
            <p className="lb-cap">{galeria[lbIndex].alt}</p>
          </div>
        </div>
      )}

      {waUrl && (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fale conosco pelo WhatsApp"
          className="wa-float"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}
    </div>
  )
}
