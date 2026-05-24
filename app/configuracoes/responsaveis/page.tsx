import { db } from "@/lib/db"
import { ResponsaveisClient } from "./responsaveis-client"

export const metadata = { title: "Responsáveis — Configurações — Escolinha Itaquerense" }

export default async function ResponsaveisPage() {
  const responsaveis = await db.responsavel.findMany({
    include: {
      _count: { select: { alunos: true } },
      alunos: {
        select: { id: true, nome: true, turma: true },
      },
    },
    orderBy: { nome: "asc" },
  })

  const alunos = await db.aluno.findMany({
    where: { status: "Ativo", responsavelId: null },
    select: { id: true, nome: true, turma: true },
    orderBy: { nome: "asc" },
  })

  return <ResponsaveisClient responsaveis={responsaveis} alunosDisponiveis={alunos} />
}
