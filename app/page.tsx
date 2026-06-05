import { getJogosPorCategoria } from "@/lib/landing/jogos"
import { getConfig } from "@/lib/config"
import { LandingClient } from "@/components/landing/landing-client"

export default async function Page() {
  const [categorias, config] = await Promise.all([
    getJogosPorCategoria(),
    getConfig(),
  ])
  return <LandingClient categorias={categorias} whatsapp={config.whatsapp} />
}
