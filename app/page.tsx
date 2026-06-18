import { getJogosPorCategoria, getHeroDestaque, heroView } from "@/lib/landing/jogos"
import { getEstatisticasClube } from "@/lib/landing/stats"
import { sobre, galeria, depoimentos } from "@/lib/landing/conteudo"
import { getConfig } from "@/lib/config"
import { LandingClient } from "@/components/landing/landing-client"

export const metadata = { title: "Escolinha Itaquerense" }

export default async function Page() {
  const [categorias, config, destaque, stats] = await Promise.all([
    getJogosPorCategoria(),
    getConfig(),
    getHeroDestaque(),
    getEstatisticasClube(),
  ])
  return (
    <LandingClient
      categorias={categorias}
      whatsapp={config.whatsapp}
      hero={heroView(destaque)}
      stats={stats}
      sobre={sobre}
      galeria={galeria}
      depoimentos={depoimentos}
    />
  )
}
