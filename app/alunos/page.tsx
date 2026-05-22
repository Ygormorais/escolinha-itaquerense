import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { AlunosClient, NovoAlunoButton } from "./alunos-client"

export default async function AlunosPage() {
  const alunos = await db.aluno.findMany({
    orderBy: { nome: "asc" },
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Alunos"
        description={`${alunos.filter((a) => a.status === "Ativo").length} alunos ativos`}
        action={<NovoAlunoButton />}
      />
      <AlunosClient alunos={alunos} />
    </div>
  )
}
