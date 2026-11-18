import type { Metadata } from "next"

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
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  }
}
