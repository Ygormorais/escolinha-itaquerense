import { getClubConfig } from "@/app/actions/config"
import { PageHeader } from "@/components/layout/page-header"
import { ConfigForm } from "./config-form"

export const metadata = { title: "Configurações — Escolinha Itaquerense" }

export default async function ConfiguracoesPage() {
  const config = await getClubConfig()
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Configurações"
        description="Dados do clube exibidos nos recibos"
      />
      <ConfigForm config={config} />
    </div>
  )
}
