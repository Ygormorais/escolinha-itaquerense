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
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Uniformes"
        description="Controle de entrega de uniformes por aluno"
      />
      <UniformesClient alunos={alunos} />
    </div>
  )
}
