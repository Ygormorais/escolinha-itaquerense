import { PageHeader } from "@/components/layout/page-header"
import { PendenciasClient } from "./pendencias-client"
import { requireAuth } from "@/lib/auth"
import { carregarPendencias } from "@/lib/pendencias-data"
import type { StaffRole } from "@/lib/permissions"

export const metadata = { title: "Pendências — Escolinha Itaquerense" }

export default async function PendenciasPage() {
  const auth = await requireAuth(["admin", "secretaria", "tecnico"])
  const grupos = await carregarPendencias(auth.role as StaffRole, auth.user)
  const total = grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0)
  return <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8"><PageHeader title="Central de pendências" description={`${total} item(ns) visíveis para o perfil ${auth.role}. Resolva, atribua ou adie sem perder o vínculo com a origem.`} /><PendenciasClient grupos={grupos} /></div>
}
