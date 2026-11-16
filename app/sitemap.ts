import type { MetadataRoute } from "next"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// Só páginas públicas e indexáveis (sem login, sem redirecionamento).
const ROTAS_PUBLICAS_SITEMAP: {
  path: string
  changeFrequency: "daily" | "weekly" | "monthly"
  priority: number
}[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/matricula", changeFrequency: "monthly", priority: 0.9 },
  { path: "/horarios", changeFrequency: "monthly", priority: 0.8 },
  { path: "/noticias/publico", changeFrequency: "weekly", priority: 0.7 },
  { path: "/partidas", changeFrequency: "daily", priority: 0.6 },
  { path: "/privacidade", changeFrequency: "monthly", priority: 0.2 },
  { path: "/termos", changeFrequency: "monthly", priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const base = BASE_URL.replace(/\/$/, "")
  return ROTAS_PUBLICAS_SITEMAP.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))
}
