import { getJogosPorCategoria } from "@/lib/landing/jogos"
import { LandingClient } from "@/components/landing/landing-client"

export default async function Page() {
  const categorias = await getJogosPorCategoria()
  return <LandingClient categorias={categorias} />
}
