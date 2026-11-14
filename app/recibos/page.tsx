import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getRecibos } from "@/app/actions/recibos"
import { getClubConfig } from "@/app/actions/config"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import RecibosForm from "./recibos-form"

export const metadata = { title: "Recibos — Escolinha Itaquerense" }

export default async function RecibosPage({ searchParams }: { searchParams: Promise<{ codigo?: string | string[] }> }) {
  await requireAuth(["admin", "secretaria"])
  const { codigo } = await searchParams
  // Link antigo de impressão (?codigo=…): o recibo agora tem página própria.
  if (typeof codigo === "string" && codigo) {
    const recibo = await db.recibo.findUnique({ where: { codigoVerificacao: codigo }, select: { id: true } })
    if (recibo) redirect(`/recibos/${recibo.id}`)
  }
  const [recibos, config] = await Promise.all([getRecibos(), getClubConfig()])
  return (
    <Suspense fallback={null}>
      <RecibosForm recibos={recibos} config={config} />
    </Suspense>
  )
}
