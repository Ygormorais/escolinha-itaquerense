import { Suspense } from "react"
import { getRecibos } from "@/app/actions/recibos"
import { getClubConfig } from "@/app/actions/config"
import RecibosForm from "./recibos-form"

export default async function RecibosPage() {
  const [recibos, config] = await Promise.all([getRecibos(), getClubConfig()])
  return (
    <Suspense fallback={null}>
      <RecibosForm recibos={recibos} config={config} />
    </Suspense>
  )
}
