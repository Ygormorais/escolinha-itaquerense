import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { PaginaPublica } from "@/components/site/pagina-publica"
import { EscudoTime } from "@/components/site/escudo-time"
import { baseUrlSite } from "@/lib/noticias/dados"
import { getPartidaFinalizadaPublica } from "@/lib/site/partidas-dados"
import { rotuloLocal } from "@/lib/site/partidas"
import {
  caminhoPartida,
  dataCurta,
  lerIdPartida,
  tituloResultado,
  whatsappCompartilharHref,
} from "@/lib/site/partida-compartilhar"
import "../partidas.css"

// Lê o banco a cada pedido: placar corrigido na FPFS aparece na hora e jogo apagado dá 404.
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ id: string }> }

async function carregar(idTexto: string) {
  const id = lerIdPartida(idTexto)
  return id === null ? null : getPartidaFinalizadaPublica(id)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await carregar((await params).id)
  // Inexistente, sem placar ou futura: sem metadados e fora do índice (a página responde 404).
  if (!p || !p.placar) return { title: "Partida não encontrada", robots: { index: false, follow: false } }
  const titulo = tituloResultado({ ...p, placar: p.placar })
  const descricao = `Resultado do ${p.categoria}, ${dataCurta(p.data)}: ${titulo}. ${p.competicao}.`
  const url = caminhoPartida(p.id)
  return {
    title: titulo,
    description: descricao,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    // O cartão 1200x630 vem de opengraph-image.tsx, na mesma pasta.
    openGraph: { type: "website", locale: "pt_BR", siteName: "Escolinha Itaquerense", title: titulo, description: descricao, url },
    twitter: { card: "summary_large_image", title: titulo, description: descricao },
  }
}

export default async function PartidaPage({ params }: Props) {
  const p = await carregar((await params).id)
  if (!p || !p.placar) notFound()
  const [golsCasa, golsFora] = p.placar
  const titulo = tituloResultado({ ...p, placar: p.placar })
  const href = whatsappCompartilharHref(p, baseUrlSite())

  return (
    <PaginaPublica titulo={titulo} descricao={`${p.categoria} · ${p.competicao} · ${dataCurta(p.data)}`} largura="leitura" className="pt">
      <article className="pt-card" aria-label={`Resultado: ${titulo}`}>
        <div className="pt-card-jogo" aria-hidden>
          <div className="pt-card-time">
            <EscudoTime nome={p.casa} nosso={p.nosCasa} urls={p.escudosAdversario} tamanho={64} />
            <span>{p.casa}</span>
          </div>
          <span className="pt-card-placar" data-numeric>{golsCasa}<span className="pt-x">×</span>{golsFora}</span>
          <div className="pt-card-time">
            <EscudoTime nome={p.fora} nosso={!p.nosCasa} urls={p.escudosAdversario} tamanho={64} />
            <span>{p.fora}</span>
          </div>
        </div>
        <p className="pt-card-detalhe">{p.categoria} · {rotuloLocal(p.local)}</p>

        <div className="pt-card-acoes">
          {href && (
            <a className="pg-btn pg-btn-primario" href={href} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} aria-hidden />
              Compartilhar no WhatsApp
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          )}
          <Link href="/partidas" className="pg-btn pg-btn-secundario">
            <ArrowLeft size={18} aria-hidden />
            Todas as partidas
          </Link>
        </div>
      </article>
    </PaginaPublica>
  )
}
