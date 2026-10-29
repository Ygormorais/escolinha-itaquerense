"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Image from "next/image"
import Link from "next/link"
import { Lock, Menu, Moon, Sun, X } from "lucide-react"
import { useTheme } from "@/components/theme"
import { depoimentos } from "@/lib/landing/conteudo"
import "@/components/landing/landing.css"
import "@/components/landing/landing-top.css"
import "./site-chrome.css"

const emptySubscribe = () => () => {}

/**
 * Topo do site público (landing e páginas internas): faixa institucional (acessos secundários) + cabeçalho com o escudo no
 * centro e o menu dividido em dois lados. Abaixo de 1240px vira barra compacta com menu
 * em gaveta. O escudo encolhe quando a faixa sai da tela e o cabeçalho fica fixo.
 *
 * O wrapper `.lp.lp-chrome` usa display:contents: entrega os tokens e estilos da landing
 * sem criar caixa, então o cabeçalho continua sticky em relação à página inteira.
 * Na landing (que já é .lp) o wrapper fica só com .lp-chrome, para não repetir o escopo.
 * Links de seção apontam para "/#..." para funcionar fora da landing também.
 */
export function SiteHeader({ whatsappUrl, dentroDaLanding = false }: { whatsappUrl: string | null; dentroDaLanding?: boolean }) {
  const temVoz = depoimentos.length > 0
  const [navOpen, setNavOpen] = useState(false)
  const [stuck, setStuck] = useState(false)
  const utilRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const themeMounted = useSyncExternalStore(emptySubscribe, () => true, () => false)
  const closeNav = () => setNavOpen(false)

  useEffect(() => {
    const el = utilRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false)
    }
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [navOpen])

  return (
    <div className={dentroDaLanding ? "lp-chrome" : "lp lp-chrome"}>
      <div className="util" ref={utilRef}>
        <div className="container util-row">
          <p className="util-id">Sociedade Esportiva Elite Itaquerense, desde 1922</p>
          <div className="util-tools">
            <a href="/responsavel" className="util-link">
              <span className="util-full">Portal da família</span>
              <span className="util-short">Portal</span>
            </a>
            {whatsappUrl && (
              <a href={whatsappUrl} className="util-link util-wa" target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            )}
            {themeMounted ? (
              <button
                type="button"
                className="util-icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Modo claro" : "Modo escuro"}
                aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
              >
                {theme === "dark" ? <Sun size={16} strokeWidth={2} aria-hidden /> : <Moon size={16} strokeWidth={2} aria-hidden />}
              </button>
            ) : (
              <span className="util-icon" aria-hidden style={{ visibility: "hidden" }} />
            )}
            <a
              href="/login"
              className="util-icon"
              aria-label="Área da equipe — painel administrativo"
              title="Área da equipe"
            >
              <Lock size={16} strokeWidth={2} aria-hidden />
            </a>
          </div>
        </div>
      </div>

      <header className={"site" + (stuck ? " is-stuck" : "")}>
        <div className="container header-row">
          <Link className="crest" href="/" onClick={closeNav} aria-label="E.C. Itaquerense, página inicial">
            <Image src="/logo.png" alt="" width={208} height={208} priority sizes="104px" />
          </Link>

          <a href="/matricula" className="btn-matricula">Matrícula</a>

          <button
            type="button"
            className="burger"
            aria-label={navOpen ? "Fechar menu" : "Menu"}
            aria-expanded={navOpen}
            aria-controls="nav"
            onClick={() => setNavOpen((o) => !o)}
          >
            {navOpen ? <X size={26} strokeWidth={2} aria-hidden /> : <Menu size={26} strokeWidth={2} aria-hidden />}
          </button>

          <nav className={"main" + (navOpen ? " open" : "")} id="nav" aria-label="Menu do site">
            <ul className="nav-l">
              <li><a href="/horarios" onClick={closeNav}>Turmas</a></li>
              <li><a href="/partidas" onClick={closeNav}>Partidas</a></li>
              <li><Link href="/#materias" onClick={closeNav}>Notícias</Link></li>
            </ul>
            <ul className="nav-r">
              <li><Link href="/#sobre" onClick={closeNav}>História</Link></li>
              <li><Link href="/#galeria" onClick={closeNav}>Galeria</Link></li>
              {temVoz && <li><Link href="/#voz" onClick={closeNav}>Voz do clube</Link></li>}
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
    </div>
  )
}
