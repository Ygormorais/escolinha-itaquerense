import { getHeroDestaque, heroView } from "@/lib/landing/jogos"
import { getNoticiasCarrossel } from "@/lib/landing/noticias"
import { getStatsLanding } from "@/lib/landing/stats"
import { db } from "@/lib/db"
import { sobre, galeria, depoimentos } from "@/lib/landing/conteudo"
import { getConfig } from "@/lib/config"
import { LandingClient } from "@/components/landing/landing-client"
import type { NoticiaClube } from "@/components/landing/noticias-clube-carrossel"

export const metadata = { title: "Escolinha Itaquerense" }

export default async function Page() {
  const [noticias, noticiasClube, config, destaque, stats] = await Promise.all([
    getNoticiasCarrossel(),
    db.noticia.findMany({
      where: { publicado: true },
      orderBy: [{ destaque: "desc" }, { createdAt: "desc" }],
      take: 9,
      select: { id: true, titulo: true, subtitulo: true, categoria: true, imagemUrl: true },
    }) as Promise<NoticiaClube[]>,
    getConfig(),
    getHeroDestaque(),
    getStatsLanding(),
  ])
  return (
    <LandingClient
      noticias={noticias}
      noticiasClube={noticiasClube}
      whatsapp={config.whatsapp}
      hero={heroView(destaque)}
      sobre={sobre}
      galeria={galeria}
      depoimentos={depoimentos}
      stats={stats}
    />
  )
}
