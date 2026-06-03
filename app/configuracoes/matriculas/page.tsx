import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { MatriculasClient } from "./matriculas-client"
import { PageHeader } from "@/components/layout/page-header"

export const metadata = { title: "Pré-Matrículas" }

export default async function MatriculasPage() {
  await requireAuth(["admin", "secretaria"])
  const matriculas = await db.preMatricula.findMany({ orderBy: { createdAt: "desc" } })

  const parsed = matriculas.map((m) => ({
    ...m,
    documentos: m.documentos ? (JSON.parse(m.documentos) as string[]) : [],
  }))

  return (
    <div className="p-6">
      <PageHeader title="Pré-Matrículas" description="Gerencie as solicitações de matrícula recebidas." />
      <MatriculasClient matriculas={parsed} />
    </div>
  )
}
