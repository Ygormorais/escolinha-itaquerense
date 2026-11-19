import { cache } from "react"
import { db } from "@/lib/db"
import { slugValido } from "@/lib/noticias/slug"

/** Base pública do site (sem barra final), para URLs absolutas de sitemap, OG e compartilhamento. */
export function baseUrlSite(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
}

/**
 * Notícia para a página pública. Só devolve se estiver PUBLICADA: rascunho e slug inexistente
 * dão o mesmo resultado (null → 404), então um rascunho nunca vaza nem confirma que existe.
 * `cache` do React deduplica a consulta entre generateMetadata, a página e a imagem OG.
 */
export const getNoticiaPublicada = cache(async (slug: string) => {
  if (!slugValido(slug)) return null
  return db.noticia.findFirst({
    where: { slug, publicado: true },
    select: {
      id: true,
      slug: true,
      titulo: true,
      subtitulo: true,
      categoria: true,
      imagemUrl: true,
      corpo: true,
      videoUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })
})

/** Notícias publicadas com slug, para o sitemap. */
export async function listarNoticiasParaSitemap() {
  return db.noticia.findMany({
    where: { publicado: true, slug: { not: null } },
    select: { slug: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  })
}
