"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function buscarGlobal(query: string) {
  await requireAuth()
  if (query.length < 2) return { alunos: [], responsaveis: [], campeonatos: [] }

  const [alunos, responsaveis, campeonatos] = await Promise.all([
    db.aluno.findMany({
      where: { nome: { contains: query } },
      select: { id: true, nome: true, turma: true, status: true },
      orderBy: { nome: "asc" },
      take: 5,
    }),
    db.responsavel.findMany({
      where: { nome: { contains: query } },
      select: { id: true, nome: true, email: true },
      orderBy: { nome: "asc" },
      take: 5,
    }),
    db.campeonato.findMany({
      where: { nome: { contains: query } },
      select: { id: true, nome: true, status: true },
      orderBy: { nome: "asc" },
      take: 5,
    }),
  ])

  return { alunos, responsaveis, campeonatos }
}

export async function buscarAlunos(query: string) {
  await requireAuth()
  if (query.length < 2) return []

  const alunos = await db.aluno.findMany({
    where: { nome: { contains: query } },
    select: { id: true, nome: true, turma: true, status: true },
    orderBy: { nome: "asc" },
    take: 8,
  })

  return alunos
}
