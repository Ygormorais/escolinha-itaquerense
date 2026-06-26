import { db } from "@/lib/db"
import { TURMAS } from "@/lib/constants"
import { RelatorioAlunosClient } from "./alunos-client"

export const metadata = { title: "Relatório de Alunos — Escolinha Itaquerense" }

export default async function RelatorioAlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string }>
}) {
  const params = await searchParams
  const turmaInicial = params.turma && (TURMAS as readonly string[]).includes(params.turma) ? params.turma : "todas"

  const alunos = await db.aluno.findMany({
    orderBy: { nome: "asc" },
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

  return <RelatorioAlunosClient alunos={alunos} turmas={[...TURMAS]} turmaInicial={turmaInicial} />
}
