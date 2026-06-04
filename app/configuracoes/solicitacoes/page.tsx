import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { PageHeader } from "@/components/layout/page-header"
import { AdminSolicitacoesClient } from "./solicitacoes-client"

export const metadata = { title: "Solicitações" }

export default async function SolicitacoesAdminPage() {
  await requireAuth(["admin", "secretaria"])
  const solicitacoes = await db.solicitacao.findMany({
    include: { responsavel: { select: { nome: true, email: true, telefone: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return (
    <div className="p-6">
      <PageHeader title="Solicitações" description="Gerencie as solicitações dos responsáveis." />
      <AdminSolicitacoesClient solicitacoes={solicitacoes} />
    </div>
  )
}
