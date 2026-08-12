import { Suspense } from "react"
import { getRecibos } from "@/app/actions/recibos"
import { getClubConfig } from "@/app/actions/config"
import { requireAuth } from "@/lib/auth"
import RecibosForm from "./recibos-form"

export const metadata = { title: "Recibos — Escolinha Itaquerense" }

export default async function RecibosPage() {
  await requireAuth(["admin", "secretaria"])
  const [recibos, config] = await Promise.all([getRecibos(), getClubConfig()])
  return (
    <Suspense fallback={null}>
      <RecibosForm recibos={recibos} config={config} />
    </Suspense>
  )
}
