import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { RenovacaoClient } from "./renovacao-client"

export const metadata = { title: "Renovação de Matrícula — Escolinha Itaquerense" }

export default async function RenovacaoPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const [alunos, renovacoes] = await Promise.all([
    db.aluno.findMany({
      where: { responsavelId: session.responsavelId, status: "Ativo" },
      select: { id: true, nome: true, turma: true, horario: true },
      orderBy: { nome: "asc" },
    }),
    db.renovacaoMatricula.findMany({
      where: { responsavelId: session.responsavelId },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        alunoId: true,
        periodo: true,
        status: true,
        observacoes: true,
        resposta: true,
        createdAt: true,
      },
    }),
  ])

  return <RenovacaoClient alunos={alunos} renovacoes={renovacoes} />
}
