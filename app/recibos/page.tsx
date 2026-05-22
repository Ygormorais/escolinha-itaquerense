import { Suspense } from "react"
import { getRecibos } from "@/app/actions/recibos"
import RecibosForm from "./recibos-form"

export default async function RecibosPage() {
  const recibos = await getRecibos()
  return (
    <Suspense fallback={null}>
      <RecibosForm recibos={recibos} />
    </Suspense>
  )
}
