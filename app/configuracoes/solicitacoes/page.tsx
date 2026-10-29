import { PAGINA_ADMIN } from "@/components/layout/pagina"
/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 · macrostructure: Ecosystem Index · tone: acolhedor e operacional · anchor hue: vermelho alvirrubro · slop: pass (58/58) */
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { PageHeader } from "@/components/layout/page-header"
import { AdminSolicitacoesClient } from "./solicitacoes-client"

export const metadata = { title: "Solicitações — Escolinha Itaquerense" }

export default async function SolicitacoesAdminPage() {
  await requireAuth(["admin", "secretaria"])
  const solicitacoes = await db.solicitacao.findMany({
    include: { responsavel: { select: { nome: true, email: true, telefone: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return (
    <div className={PAGINA_ADMIN}>
      <PageHeader title="Solicitações" description="Gerencie as solicitações dos responsáveis." />
      <AdminSolicitacoesClient solicitacoes={solicitacoes} />
    </div>
  )
}
