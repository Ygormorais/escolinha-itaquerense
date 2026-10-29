import type { AnuncioPublico } from "@/lib/site/anuncios"
import "./anuncio-banner.css"

/**
 * Banner de publicidade. O link passa por /api/anuncio/:id, que conta o clique e
 * redireciona. rel="sponsored" avisa os buscadores que é link pago.
 */
export function AnuncioBanner({
  anuncio,
  dentroDeContainer = false,
  contratarUrl = null,
}: {
  anuncio: AnuncioPublico | null
  /** true quando a página já envolve o banner num .container. */
  dentroDeContainer?: boolean
  /** Link (WhatsApp) para contratar o espaço; sem anúncio ativo, o espaço é oferecido. */
  contratarUrl?: string | null
}) {
  const inner = dentroDeContainer ? "anuncio-inner" : "container anuncio-inner"
  if (!anuncio) {
    if (!contratarUrl) return null
    return (
      <aside className="anuncio" aria-label="Espaço publicitário disponível">
        <div className={inner}>
          <span className="anuncio-rotulo">Publicidade</span>
          <div className="anuncio-vago">
            <div>
              <p className="anuncio-vago-titulo">Anuncie aqui</p>
              <p className="anuncio-vago-texto">
                Espaço aberto para patrocinadores: sua marca para as famílias e a torcida do
                Itaquerense, na página do clube.
              </p>
            </div>
            <a href={contratarUrl} target="_blank" rel="noopener" className="anuncio-vago-cta">
              Seja patrocinador
              <span className="sr-only"> (abre o WhatsApp do clube em nova aba)</span>
            </a>
          </div>
        </div>
      </aside>
    )
  }
  return (
    <aside className="anuncio" aria-label={`Publicidade: ${anuncio.anunciante}`}>
      <div className={inner}>
        <span className="anuncio-rotulo">Publicidade</span>
        <a href={`/api/anuncio/${anuncio.id}`} target="_blank" rel="sponsored noopener" className="anuncio-link">
          <picture>
            {anuncio.imagemMobileUrl && <source media="(max-width: 640px)" srcSet={anuncio.imagemMobileUrl} />}
            <img src={anuncio.imagemUrl} alt={anuncio.titulo} loading="lazy" decoding="async" />
          </picture>
          <span className="sr-only"> (abre o site de {anuncio.anunciante} em nova aba)</span>
        </a>
      </div>
    </aside>
  )
}
