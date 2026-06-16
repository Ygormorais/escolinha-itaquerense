import { requireAuth } from "@/lib/auth"
import { ImportarExtratoClient } from "@/components/pagamentos/importar-extrato-client"

export const metadata = { title: "Importar Extrato OFX — Pagamentos" }

export default async function ImportarExtratoPage() {
  await requireAuth()
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div>
        <a
          href="/pagamentos"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Pagamentos
        </a>
      </div>
      <h1 className="text-2xl font-bold">Importar Extrato OFX</h1>
      <ImportarExtratoClient />
    </div>
  )
}
