import type { MetadataRoute } from "next"
import { listarNoticiasParaSitemap } from "@/lib/noticias/dados"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Só páginas públicas e indexáveis (sem login, sem redirecionamento).
const ROTAS_PUBLICAS_SITEMAP: {
  path: string
  changeFrequency: "daily" | "weekly" | "monthly"
  priority: number
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/matricula", changeFrequency: "monthly", priority: 0.9 },
  { path: "/aula-experimental", changeFrequency: "weekly", priority: 0.8 },
  { path: "/horarios", changeFrequency: "monthly", priority: 0.8 },
  { path: "/noticias/publico", changeFrequency: "weekly", priority: 0.7 },
  { path: "/partidas", changeFrequency: "daily", priority: 0.6 },
  { path: "/privacidade", changeFrequency: "monthly", priority: 0.2 },
  { path: "/termos", changeFrequency: "monthly", priority: 0.2 },
]

// Lê o banco a cada pedido: notícia publicada entra no sitemap, despublicada sai.
export const dynamic = "force-dynamic"

/**
 * Matérias editoriais estáticas da landing (lib/landing/materias.ts) NÃO entram aqui: não têm
 * página própria, apontam para a fonte original (links externos) ou para a própria landing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = BASE_URL.replace(/\/$/, "")
  const fixas = ROTAS_PUBLICAS_SITEMAP.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))

  let noticias: { slug: string | null; updatedAt: Date }[] = []
  try {
    noticias = await listarNoticiasParaSitemap()
  } catch {
    // Banco indisponível: o sitemap continua válido com as rotas fixas.
  }
  return [
    ...fixas,
    ...noticias.flatMap((n) =>
      n.slug
        ? [{ url: `${base}/noticias/publico/${n.slug}`, lastModified: n.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 }]
        : [],
    ),
  ]
}
