import { PageHeader } from "@/components/layout/page-header"
import { requireAuth } from "@/lib/auth"
import { AutomacoesClient } from "./automacoes-client"
export const metadata = { title: "Automações — Escolinha Itaquerense" }
export default async function AutomacoesPage() { await requireAuth(["admin", "secretaria"]); return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8"><PageHeader title="Automações administrativas" description="Regras locais que criam pendências internas revisáveis. Nenhuma mensagem externa é enviada automaticamente." /><AutomacoesClient /></div> }
