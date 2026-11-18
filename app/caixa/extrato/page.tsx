import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { PageHeader } from "@/components/layout/page-header"
import { ExtratoClient } from "./extrato-client"
import { getLancamentos, getResumoExtrato } from "@/app/actions/extrato"
import { requireAuth } from "@/lib/auth"

export const metadata = { title: "Extrato Bancário — Escolinha Itaquerense" }

export default async function ExtratoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  // O proxy só confere o cookie; aqui o perfil vem do banco.
  await requireAuth(["admin"])
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [lancamentos, resumo] = await Promise.all([
    getLancamentos({ mes }),
    getResumoExtrato(mes),
  ])

  return (
    <div className={PAGINA_ADMIN}>
      <PageHeader
        title="Extrato Bancário"
        description="Importe o extrato do seu banco e acompanhe entradas e saídas"
      />
      <ExtratoClient lancamentos={lancamentos} resumo={resumo} mes={mes} />
    </div>
  )
}
