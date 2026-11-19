import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, MessageCircle } from "lucide-react"
import { PaginaPublica } from "@/components/site/pagina-publica"
import { YoutubeFacade } from "@/components/site/youtube-facade"
import { baseUrlSite, getNoticiaPublicada } from "@/lib/noticias/dados"
import { descricaoCurta, linkWhatsApp, paragrafos, videoYoutubeId } from "@/lib/noticias/conteudo"
import { jsonLdSeguro, noticiaJsonLd } from "@/lib/noticias/json-ld"
import "./noticia.css"

// Sempre lê o banco: despublicar uma notícia tira a página do ar na hora (404), sem HTML antigo em cache.
export const dynamic = "force-dynamic"

const CLUBE = "E.C. Itaquerense"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const n = await getNoticiaPublicada(slug)
  // Não publicada/inexistente: sem metadados (a página responde 404 e não é indexada).
  if (!n) return { title: "Notícia não encontrada", robots: { index: false, follow: false } }

  const descricao = descricaoCurta(n.subtitulo, n.corpo)
  const url = `/noticias/publico/${n.slug}`
  return {
    title: `${n.titulo} — ${CLUBE}`,
    description: descricao || undefined,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      title: n.titulo,
      description: descricao || undefined,
      url,
      siteName: CLUBE,
      locale: "pt_BR",
      publishedTime: n.createdAt.toISOString(),
      modifiedTime: n.updatedAt.toISOString(),
      section: n.categoria,
      // Com foto própria usa a foto; sem foto, vale o cartão gerado em opengraph-image.tsx.
      ...(n.imagemUrl ? { images: [{ url: n.imagemUrl, alt: n.titulo }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: n.titulo,
      description: descricao || undefined,
      ...(n.imagemUrl ? { images: [n.imagemUrl] } : {}),
    },
  }
}

export default async function NoticiaPage({ params }: Props) {
  const { slug } = await params
  const n = await getNoticiaPublicada(slug)
  if (!n) notFound()

  const base = baseUrlSite()
  const url = `${base}/noticias/publico/${n.slug}`
  const paragrafosTexto = paragrafos(n.corpo)
  const videoId = videoYoutubeId(n.videoUrl)
  const data = format(n.createdAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  const jsonLd = noticiaJsonLd({
    titulo: n.titulo,
    descricao: descricaoCurta(n.subtitulo, n.corpo),
    url,
    imagem: n.imagemUrl ?? `${base}/logo.png`,
    publicadaEm: n.createdAt,
    atualizadaEm: n.updatedAt,
    categoria: n.categoria,
    clube: CLUBE,
    logoUrl: `${base}/logo.png`,
  })

  return (
    <PaginaPublica titulo={n.titulo} descricao={n.subtitulo ?? undefined} largura="leitura" className="nt">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdSeguro(jsonLd) }} />

      <article>
        <p className="nt-meta">
          <span className="nt-cat">{n.categoria}</span>
          <time dateTime={n.createdAt.toISOString()}>{data}</time>
        </p>

        {n.imagemUrl && (
          // Foto cadastrada por URL livre: <img> simples (next/image exige host liberado no next.config).
          // eslint-disable-next-line @next/next/no-img-element
          <img className="nt-capa" src={n.imagemUrl} alt="" width={1200} height={630} />
        )}

        {paragrafosTexto.length > 0 && (
          <div className="nt-texto pg-texto">
            {paragrafosTexto.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        {videoId && (
          <div className="nt-video">
            <YoutubeFacade videoId={videoId} titulo={n.titulo} />
          </div>
        )}

        <div className="nt-acoes">
          <a
            className="pg-btn pg-btn-primario"
            href={linkWhatsApp(n.titulo, url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} aria-hidden />
            Compartilhar no WhatsApp
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          <Link href="/noticias/publico" className="pg-btn pg-btn-secundario">
            <ArrowLeft size={18} aria-hidden />
            Todas as notícias
          </Link>
        </div>
      </article>
    </PaginaPublica>
  )
}
