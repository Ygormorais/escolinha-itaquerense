import { PageHeader } from "@/components/layout/page-header"
import { ExtratoClient } from "./extrato-client"
import { getLancamentos, getResumoExtrato } from "@/app/actions/extrato"

export const metadata = { title: "Extrato Bancário — Escolinha Itaquerense" }

export default async function ExtratoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [lancamentos, resumo] = await Promise.all([
    getLancamentos({ mes }),
    getResumoExtrato(mes),
  ])

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Extrato Bancário"
        description="Importe o extrato do seu banco e acompanhe entradas e saídas"
      />
      <ExtratoClient lancamentos={lancamentos} resumo={resumo} mes={mes} />
    </div>
  )
}
