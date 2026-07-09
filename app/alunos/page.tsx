import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { AlunosClient, NovoAlunoButton } from "./alunos-client"
import { PAGE_SIZE } from "@/lib/constants"
import { plural } from "@/lib/utils"
import { startOfMonth, endOfMonth } from "date-fns"

export const metadata = { title: "Alunos — Escolinha Itaquerense" }

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

  const now = new Date()
  const inicioMes = startOfMonth(now)
  const fimMes = endOfMonth(now)

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

  // Calcular frequência do mês corrente apenas para os alunos ativos na página
  const idsAtivos = alunos.filter((a) => a.status === "Ativo").map((a) => a.id)
  const frequenciasBaixa = new Set<number>()

  if (idsAtivos.length > 0) {
    const [freqs, presentes] = await Promise.all([
      db.frequencia.groupBy({
        by: ["alunoId"],
        where: {
          alunoId: { in: idsAtivos },
          data: { gte: inicioMes, lte: fimMes },
        },
        _count: { id: true },
      }),
      db.frequencia.groupBy({
        by: ["alunoId"],
        where: {
          alunoId: { in: idsAtivos },
          data: { gte: inicioMes, lte: fimMes },
          presenca: "Presente",
        },
        _count: { id: true },
      }),
    ])

    const totalMap = new Map(freqs.map((f) => [f.alunoId, f._count.id]))
    const presentesMap = new Map(presentes.map((f) => [f.alunoId, f._count.id]))

    for (const id of idsAtivos) {
      const total = totalMap.get(id) ?? 0
      const pres = presentesMap.get(id) ?? 0
      if (total >= 3 && pres / total < 0.75) {
        frequenciasBaixa.add(id)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Alunos"
        description={plural(totalAtivos, "aluno ativo", "alunos ativos")}
        action={<NovoAlunoButton />}
      />
      <AlunosClient
        alunos={alunos}
        total={total}
        page={page}
        totalPages={totalPages}
        filters={{ q, turma, status }}
        frequenciaBaixa={[...frequenciasBaixa]}
      />
    </div>
  )
}
