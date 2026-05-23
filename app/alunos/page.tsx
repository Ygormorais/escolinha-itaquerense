import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { AlunosClient, NovoAlunoButton } from "./alunos-client"
import { PAGE_SIZE } from "@/lib/constants"

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; turma?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const q = params.q ?? ""
  const turma = params.turma ?? "Todas"
  const status = params.status ?? "Todos"
  const page = Math.max(1, Number(params.page ?? 1))

  const where = {
    ...(q ? { nome: { contains: q } } : {}),
    ...(turma !== "Todas" ? { turma } : {}),
    ...(status !== "Todos" ? { status } : {}),
  }

  const [alunos, total, totalAtivos] = await Promise.all([
    db.aluno.findMany({
      where,
      orderBy: { nome: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.aluno.count({ where }),
    db.aluno.count({ where: { status: "Ativo" } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Alunos"
        description={`${totalAtivos} alunos ativos`}
        action={<NovoAlunoButton />}
      />
      <AlunosClient
        alunos={alunos}
        total={total}
        page={page}
        totalPages={totalPages}
        filters={{ q, turma, status }}
      />
    </div>
  )
}
