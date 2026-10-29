import type { AnuncioPublico } from "@/lib/site/anuncios"
import "./anuncio-banner.css"

/**
 * Banner de publicidade. O link passa por /api/anuncio/:id, que conta o clique e
 * redireciona. rel="sponsored" avisa os buscadores que é link pago.
 */
export function AnuncioBanner({
  anuncio,
  dentroDeContainer = false,
}: {
  anuncio: AnuncioPublico | null
  /** true quando a página já envolve o banner num .container. */
  dentroDeContainer?: boolean
}) {
  if (!anuncio) return null
  return (
    <aside className="anuncio" aria-label={`Publicidade: ${anuncio.anunciante}`}>
      <div className={dentroDeContainer ? "anuncio-inner" : "container anuncio-inner"}>
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
