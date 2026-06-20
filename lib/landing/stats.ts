import { db } from "@/lib/db"

export interface StatsLanding {
  alunosAtivos: number
  categoriasAtivas: number
}

export async function getStatsLanding(): Promise<StatsLanding> {
  const [alunosAtivos, turmas] = await Promise.all([
    db.aluno.count({ where: { status: "Ativo" } }),
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { turma: true },
      distinct: ["turma"],
    }),
  ])
  return { alunosAtivos, categoriasAtivas: turmas.length }
}
