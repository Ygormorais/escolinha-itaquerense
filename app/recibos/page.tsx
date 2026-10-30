import { Suspense } from "react"
import { getRecibos } from "@/app/actions/recibos"
import { getClubConfig } from "@/app/actions/config"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import RecibosForm from "./recibos-form"

export const metadata = { title: "Recibos — Escolinha Itaquerense" }

export default async function RecibosPage({ searchParams }: { searchParams: Promise<{ codigo?: string | string[] }> }) {
  await requireAuth(["admin", "secretaria"])
  const { codigo } = await searchParams
  const [recibos, config, reciboSalvo] = await Promise.all([
    getRecibos(),
    getClubConfig(),
    // Impressão de um recibo emitido por uma baixa: carrega o registro pelo código.
    typeof codigo === "string" && codigo ? db.recibo.findUnique({ where: { codigoVerificacao: codigo } }) : null,
  ])
  return (
    <Suspense fallback={null}>
      <RecibosForm recibos={recibos} config={config} reciboSalvo={reciboSalvo} />
    </Suspense>
  )
}
