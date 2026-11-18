import type { Metadata } from "next"

const ALT_PREVIA = "Escolinha de Futsal E.C. Itaquerense — Itaquera, São Paulo"

/**
 * Metadata das páginas públicas indexáveis. O template do layout raiz
 * ("%s — Escolinha Itaquerense") acrescenta o nome do clube sozinho: passe só
 * o título da página, sem sufixo.
 *
 * Gera título, descrição única, URL canônica relativa (resolvida por
 * metadataBase) e o Open Graph da própria página. O openGraph de uma página
 * substitui o do layout por inteiro, por isso tipo/idioma/site são repetidos.
 */
export function metadataPublica({
  title,
  description,
  path,
}: {
  title: string
  description: string
  /** Caminho canônico, ex.: "/horarios". Use "/" para a home. */
  path: string
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Escolinha Itaquerense",
      title,
      description,
      url: path,
      // O openGraph da página substitui o do layout, e com ele a imagem do arquivo
      // app/opengraph-image.tsx: sem repetir aqui, a prévia sairia sem foto.
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: ALT_PREVIA }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/twitter-image"] },
    robots: { index: true, follow: true },
  }
}
