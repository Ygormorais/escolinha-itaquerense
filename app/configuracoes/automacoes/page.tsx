import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { PageHeader } from "@/components/layout/page-header"
import { requireAuth } from "@/lib/auth"
import { AutomacoesClient } from "./automacoes-client"
export const metadata = { title: "Automações — Escolinha Itaquerense" }
export default async function AutomacoesPage() { await requireAuth(["admin", "secretaria"]); return <div className={PAGINA_ADMIN}><PageHeader title="Automações administrativas" description="Regras locais que criam pendências internas revisáveis. Nenhuma mensagem externa é enviada automaticamente." /><AutomacoesClient /></div> }
