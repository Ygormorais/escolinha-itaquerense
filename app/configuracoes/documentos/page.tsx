import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { DocumentosAdminClient } from "./documentos-client"

export const metadata = { title: "Documentos — Escolinha Itaquerense" }

export default async function DocumentosPage() {
  await requireAuth(["admin", "secretaria"])
  const documentos = await db.documentoInstitucional.findMany({
    include: {
      versoes: {
        orderBy: [{ publicadoEm: "desc" }, { id: "desc" }],
        include: { _count: { select: { aceites: true } } },
      },
    },
    orderBy: [{ ativo: "desc" }, { updatedAt: "desc" }],
  })
  return <div className={PAGINA_ADMIN}><PageHeader title="Documentos e aceites" description="Publique versões imutáveis e acompanhe os aceites associados a cada versão." /><DocumentosAdminClient documentos={documentos} /></div>
}
