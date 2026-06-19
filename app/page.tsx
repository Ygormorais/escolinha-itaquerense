import { getJogosPorCategoria, getHeroDestaque, heroView } from "@/lib/landing/jogos"
import { sobre, galeria, depoimentos } from "@/lib/landing/conteudo"
import { getConfig } from "@/lib/config"
import { LandingClient } from "@/components/landing/landing-client"

export const metadata = { title: "Escolinha Itaquerense" }

export default async function Page() {
  const [categorias, config, destaque] = await Promise.all([
    getJogosPorCategoria(),
    getConfig(),
    getHeroDestaque(),
  ])
  return (
    <LandingClient
      categorias={categorias}
      whatsapp={config.whatsapp}
      hero={heroView(destaque)}
      sobre={sobre}
      galeria={galeria}
      depoimentos={depoimentos}
    />
  )
}
