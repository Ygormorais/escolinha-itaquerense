"use server"

import { db } from "@/lib/db"

export async function buscarAlunos(query: string) {
  if (query.length < 2) return []

  const alunos = await db.aluno.findMany({
    where: {
      nome: { contains: query },
    },
    select: {
      id: true,
      nome: true,
      turma: true,
      status: true,
    },
    orderBy: { nome: "asc" },
    take: 8,
  })

  return alunos
}
