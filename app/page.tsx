import { heroView } from "@/lib/landing/jogos"
import { getNoticiasPorCategoria } from "@/lib/landing/noticias"

import { db } from "@/lib/db"
import { sobre, galeria, depoimentos } from "@/lib/landing/conteudo"
import { getConfig } from "@/lib/config"
import { LandingClient } from "@/components/landing/landing-client"
import type { NoticiaClube } from "@/components/landing/noticias-clube-carrossel"

export const metadata = { title: "Escolinha Itaquerense" }

/** Landing sempre com jogos/resultados atualizados. */
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Separação de papéis (anti-redundância):
 * - Hero → institucional (marca / formação de base)
 * - Carrossel → jogos/resultados com abas por categoria (Sub-7…Sub-18)
 */
export default async function Page() {
  const [jogosPorCategoria, noticiasClube, config] = await Promise.all([
    getNoticiasPorCategoria(),
    db.noticia.findMany({
      where: { publicado: true },
      orderBy: [{ destaque: "desc" }, { createdAt: "desc" }],
      take: 9,
      select: { id: true, titulo: true, subtitulo: true, categoria: true, imagemUrl: true },
    }) as Promise<NoticiaClube[]>,
    getConfig(),
  ])
  return (
    <LandingClient
      jogosPorCategoria={jogosPorCategoria}
      noticiasClube={noticiasClube}
      whatsapp={config.whatsapp}
      hero={heroView({ tipo: "institucional" })}
      sobre={sobre}
      galeria={galeria}
      depoimentos={depoimentos}
      endereco={config.endereco}
      cidade={config.cidade}
    />
  )
}
