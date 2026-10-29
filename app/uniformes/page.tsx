import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { UniformesClient } from "./uniformes-client"

export const metadata = { title: "Uniformes — Escolinha Itaquerense" }

export default async function UniformesPage() {
  const alunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    include: {
      uniformes: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { nome: "asc" },
  })

  return (
    <div className={PAGINA_ADMIN}>
      <PageHeader
        title="Uniformes"
        description="Controle de entrega de uniformes por aluno"
      />
      <UniformesClient alunos={alunos} />
    </div>
  )
}
