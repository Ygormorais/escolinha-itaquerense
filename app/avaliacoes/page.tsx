import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { AvaliacoesClient } from "./avaliacoes-client"

export const metadata = { title: "Avaliações — Escolinha Itaquerense" }

export default async function AvaliacoesPage() {
  await requireAuth()

  const [avaliacoes, alunos] = await Promise.all([
    db.avaliacao.findMany({
      include: { aluno: { select: { id: true, nome: true, turma: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.aluno.findMany({
      where: { status: "Ativo" },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, turma: true },
    }),
  ])

  return <AvaliacoesClient avaliacoes={avaliacoes} alunos={alunos} />
}
