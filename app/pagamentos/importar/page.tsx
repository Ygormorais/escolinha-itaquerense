import { requireAuth } from "@/lib/auth"
import { ImportarExtratoClient } from "@/components/pagamentos/importar-extrato-client"
import { PageHeader } from "@/components/layout/page-header"

export const metadata = { title: "Importar Extrato OFX — Pagamentos" }

export default async function ImportarExtratoPage() {
  await requireAuth()
  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <div>
        <a
          href="/pagamentos"
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Pagamentos
        </a>
        <PageHeader
          title="Importar Extrato OFX"
          description="Importe o arquivo OFX do banco e reconcilie com os pagamentos"
        />
      </div>
      <ImportarExtratoClient />
    </div>
  )
}
