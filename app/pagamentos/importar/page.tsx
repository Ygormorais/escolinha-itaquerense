import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { requireAuth } from "@/lib/auth"
import { ImportarExtratoClient } from "@/components/pagamentos/importar-extrato-client"
import { PageHeader } from "@/components/layout/page-header"

export const metadata = { title: "Importar extrato OFX — Pagamentos" }

export default async function ImportarExtratoPage() {
  await requireAuth()
  return (
    <div className={PAGINA_ADMIN}>
      <div>
        <a
          href="/pagamentos"
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Pagamentos
        </a>
        <PageHeader
          title="Importar extrato OFX"
          description="Importe o arquivo OFX do banco e reconcilie com os pagamentos"
        />
      </div>
      <ImportarExtratoClient />
    </div>
  )
}
