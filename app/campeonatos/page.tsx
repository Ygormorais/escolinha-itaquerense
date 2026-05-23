import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { CampeonatoClient } from "./campeonato-client"

export const metadata = { title: "Campeonatos — Escolinha Itaquerense" }

export default async function CampeonatosPage() {
  const campeonatos = await db.campeonato.findMany({
    include: { _count: { select: { inscricoes: true } } },
    orderBy: { dataInicio: "desc" },
  })

  const alunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: { id: true, nome: true, turma: true },
    orderBy: { nome: "asc" },
  })

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader title="Campeonatos" description="Gerenciamento de campeonatos, taxas e inscrições" />
      <CampeonatoClient campeonatos={campeonatos as any} alunos={alunos as any} />
    </div>
  )
}
