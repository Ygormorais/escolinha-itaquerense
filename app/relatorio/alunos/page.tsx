import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { TURMAS } from "@/lib/constants"
import { RelatorioAlunosClient } from "./alunos-client"
import { buildAlunoOrderBy, buildAlunoWhere, parseAlunoReportFilters, REPORT_PAGE_SIZE } from "@/lib/report-query"

export const metadata = { title: "Relatório de Alunos — Escolinha Itaquerense" }

export default async function RelatorioAlunosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { role } = await requireAuth(["admin", "secretaria"])
  const params = await searchParams
  const filters = parseAlunoReportFilters(params)
  const where = buildAlunoWhere(filters)

  const [total, ativos, inativos, mensalidades] = await Promise.all([
    db.aluno.count({ where }),
    db.aluno.count({ where: { AND: [where, { status: "Ativo" }] } }),
    db.aluno.count({ where: { AND: [where, { status: { not: "Ativo" } }] } }),
    db.aluno.aggregate({ where: { AND: [where, { status: "Ativo" }] }, _sum: { mensalidade: true } }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / REPORT_PAGE_SIZE))
  const page = Math.min(filters.page, totalPages)
  const alunos = await db.aluno.findMany({
    where,
    orderBy: buildAlunoOrderBy(filters),
    skip: (page - 1) * REPORT_PAGE_SIZE,
    take: REPORT_PAGE_SIZE,
    select: {
      id: true,
      nome: true,
      turma: true,
      horario: true,
      status: true,
      responsavel: true,
      telefone: true,
      mensalidade: true,
      dataMatricula: true,
      dataNascimento: true,
    },
  })

  const totalMensalidade = mensalidades._sum.mensalidade ?? 0
  return (
    <RelatorioAlunosClient
      key={JSON.stringify({ ...filters, page })}
      alunos={alunos}
      turmas={[...TURMAS]}
      role={role as "admin" | "secretaria"}
      filters={{ ...filters, page }}
      total={total}
      totalPages={totalPages}
      resumo={{ ativos, inativos, totalMensalidade, mediaMensalidade: ativos > 0 ? totalMensalidade / ativos : 0 }}
    />
  )
}
