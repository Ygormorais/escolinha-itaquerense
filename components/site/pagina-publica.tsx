import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { publicFontClass } from "@/lib/public-fonts"
import { SiteRodape, SiteTopo } from "./site-chrome"
import "./pagina-publica.css"

/**
 * Moldura das páginas internas do site público: cabeçalho e rodapé do site, faixa de
 * título escura com trilha (Início › Página) e o corpo no container padrão.
 * Partidas, turmas, pré-matrícula, notícias, termos e privacidade usam esta moldura.
 */
export function PaginaPublica({
  titulo,
  descricao,
  complemento,
  largura = "normal",
  className,
  children,
}: {
  titulo: string
  descricao?: ReactNode
  /** Conteúdo extra na faixa de título, abaixo da descrição (ex.: garantias da matrícula). */
  complemento?: ReactNode
  /** "leitura" estreita o corpo para formulários e textos longos. */
  largura?: "normal" | "leitura"
  /** Namespace de CSS da página, aplicado à raiz. */
  className?: string
  children: ReactNode
}) {
  return (
    <div className={[publicFontClass, "lp", "pg", className].filter(Boolean).join(" ")}>
      <a className="skip-link" href="#conteudo-principal">Ir para o conteúdo</a>
      <SiteTopo dentroDaLanding />

      <main id="conteudo-principal">
        <div className="pg-hero">
          <div className={"container" + (largura === "leitura" ? " pg-leitura" : "")}>
            <nav className="pg-trilha" aria-label="Você está em">
              <Link href="/">Início</Link>
              <ChevronRight size={14} aria-hidden />
              <span aria-current="page">{titulo}</span>
            </nav>
            <h1>{titulo}</h1>
            {descricao && <p className="pg-descricao">{descricao}</p>}
            {complemento}
          </div>
        </div>

        <div className={"container pg-corpo" + (largura === "leitura" ? " pg-leitura" : "")}>{children}</div>
      </main>

      <SiteRodape dentroDaLanding />
    </div>
  )
}
