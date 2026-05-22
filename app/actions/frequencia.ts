"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function salvarFrequencia(
  registros: { alunoId: number; data: string; presenca: string }[]
) {
  await Promise.all(
    registros.map((r) =>
      db.frequencia.upsert({
        where: { alunoId_data: { alunoId: r.alunoId, data: new Date(r.data) } },
        update: { presenca: r.presenca },
        create: { alunoId: r.alunoId, data: new Date(r.data), presenca: r.presenca },
      })
    )
  )

  revalidatePath("/frequencia")
  revalidatePath("/")
}

export async function getFrequenciaPorTurmaData(turma: string, data: string) {
  const alunos = await db.aluno.findMany({
    where: { turma, status: "Ativo" },
    include: {
      frequencias: {
        where: { data: new Date(data) },
      },
    },
    orderBy: { nome: "asc" },
  })

  return alunos.map((a) => ({
    id: a.id,
    nome: a.nome,
    presenca: a.frequencias[0]?.presenca ?? null,
  }))
}
