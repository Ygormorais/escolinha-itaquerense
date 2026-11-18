export interface NoticiaJsonLdInput {
  titulo: string
  descricao: string
  url: string
  imagem: string
  publicadaEm: Date
  atualizadaEm: Date
  categoria: string
  clube: string
  logoUrl: string
}

/** Dados estruturados schema.org NewsArticle (só conteúdo público da matéria; nada de pessoa). */
export function noticiaJsonLd(n: NoticiaJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: n.titulo.slice(0, 110),
    description: n.descricao || undefined,
    image: [n.imagem],
    datePublished: n.publicadaEm.toISOString(),
    dateModified: n.atualizadaEm.toISOString(),
    articleSection: n.categoria,
    inLanguage: "pt-BR",
    mainEntityOfPage: { "@type": "WebPage", "@id": n.url },
    author: { "@type": "Organization", name: n.clube },
    publisher: {
      "@type": "Organization",
      name: n.clube,
      logo: { "@type": "ImageObject", url: n.logoUrl },
    },
  }
}

/** Serializa para <script type="application/ld+json"> sem permitir fechar a tag (`<` escapado). */
export function jsonLdSeguro(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c")
}
