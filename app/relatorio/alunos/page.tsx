import { db } from "@/lib/db"
import { TURMAS } from "@/lib/constants"
import { RelatorioAlunosClient } from "./alunos-client"

export const metadata = { title: "Relatório de Alunos — Escolinha Itaquerense" }

export default async function RelatorioAlunosPage() {
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
    },
  })

  return <RelatorioAlunosClient alunos={alunos as any} turmas={[...TURMAS]} />
}
