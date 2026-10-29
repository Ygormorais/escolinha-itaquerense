import Image from "next/image"
import Link from "next/link"
import { Lock } from "lucide-react"
import { depoimentos } from "@/lib/landing/conteudo"
import { TEXTO_CONTATO, TEXTO_NOVIDADES, whatsappUrl } from "@/lib/site/whatsapp"
import "@/components/landing/landing.css"
import "./site-chrome.css"
import "./site-footer.css"

interface Grupo {
  titulo: string
  links: { href: string; rotulo: string; externo?: boolean }[]
}

/**
 * Rodapé do site público: faixa de novidades pelo WhatsApp, mapa do site agrupado por
 * tema e barra final. Sem estado, então serve tanto a landing (client) quanto as
 * páginas internas (server).
 */
export function SiteFooter({
  whatsapp,
  endereco,
  cidade,
  dentroDaLanding = false,
}: {
  whatsapp?: string | null
  endereco?: string | null
  cidade?: string | null
  /** Na landing o wrapper não repete a classe .lp (ela já envolve a página). */
  dentroDaLanding?: boolean
}) {
  const waContato = whatsappUrl(whatsapp, TEXTO_CONTATO)
  const waNovidades = whatsappUrl(whatsapp, TEXTO_NOVIDADES)

  const grupos: Grupo[] = [
    {
      titulo: "Clube",
      links: [
        { href: "/#sobre", rotulo: "Nossa história" },
        { href: "/noticias/publico", rotulo: "Notícias" },
        { href: "/#galeria", rotulo: "Galeria" },
        ...(depoimentos.length > 0 ? [{ href: "/#voz", rotulo: "Voz do clube" }] : []),
      ],
    },
    {
      titulo: "Escolinha",
      links: [
        { href: "/horarios", rotulo: "Turmas e horários" },
        { href: "/matricula", rotulo: "Pré-matrícula" },
        { href: "/partidas", rotulo: "Partidas" },
      ],
    },
    {
      titulo: "Família",
      links: [
        { href: "/responsavel", rotulo: "Portal da família" },
        ...(waContato ? [{ href: waContato, rotulo: "Falar com a secretaria", externo: true }] : []),
      ],
    },
  ]

  return (
    <div className={dentroDaLanding ? "lp-chrome" : "lp lp-chrome"}>
      <footer className="site-foot">
        {waNovidades && (
          <div className="foot-news">
            <div className="container foot-news-row">
              <div className="foot-news-txt">
                <h2>Novidades no WhatsApp</h2>
                <p>
                  Jogos, resultados e avisos da escolinha direto no seu celular. Mande a mensagem e
                  entre na lista de transmissão do clube.
                </p>
              </div>
              <a href={waNovidades} className="foot-news-btn" target="_blank" rel="noopener noreferrer">
                Quero receber
              </a>
            </div>
          </div>
        )}

        <div className="container foot-main">
          <div className="foot-brand">
            <div className="foot-name">
              <Image src="/logo.png" alt="" width={64} height={64} />
              <strong>Elite<br />Itaquerense</strong>
            </div>
            <p>
              Sociedade Esportiva Elite Itaquerense — tradição alvirrubra em Itaquera desde 1922.
              Formação esportiva e humana para as novas gerações.
            </p>
            {(endereco || cidade) && (
              <address>
                {endereco && <span>{endereco}</span>}
                {cidade && <span>{cidade}</span>}
              </address>
            )}
          </div>

          <nav className="foot-map" aria-label="Mapa do site">
            {grupos.map((g) => (
              <div className="foot-col" key={g.titulo}>
                <h3>{g.titulo}</h3>
                <ul>
                  {g.links.map((l) => (
                    <li key={l.href}>
                      {l.externo ? (
                        <a href={l.href} target="_blank" rel="noopener noreferrer">{l.rotulo}</a>
                      ) : (
                        <Link href={l.href}>{l.rotulo}</Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="foot-bottom">
          <div className="container foot-bottom-row">
            <span>© {new Date().getFullYear()} Sociedade Esportiva Elite Itaquerense</span>
            <span className="foot-legal">
              <a href="/privacidade">Privacidade</a>
              <a href="/termos">Termos</a>
              <a href="/login" className="foot-staff" title="Acesso restrito à equipe administrativa">
                <Lock size={12} strokeWidth={2} aria-hidden />
                Área da equipe
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
