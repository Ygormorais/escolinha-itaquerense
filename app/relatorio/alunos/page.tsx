import { db } from "@/lib/db"
import { TURMAS } from "@/lib/constants"
import { RelatorioAlunosClient } from "./alunos-client"

export const metadata = { title: "Relatório de Alunos — Escolinha Itaquerense" }

type AlunoRow = {
  id: number
  nome: string
  turma: string
  horario: string
  status: string
  responsavel: string | null
  telefone: string | null
  mensalidade: number
  dataMatricula: Date
}

export default async function RelatorioAlunosPage() {
  const alunos: AlunoRow[] = await db.aluno.findMany({
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
    },
  })

  return <RelatorioAlunosClient alunos={alunos} turmas={[...TURMAS]} />
}
