"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function listarAvaliacoes() {
  await requireAuth()
  return db.avaliacao.findMany({
    include: { aluno: { select: { id: true, nome: true, turma: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function criarAvaliacao(data: {
  alunoId: number
  periodo: string
  notaTecnica?: number
  notaFisica?: number
  notaComportamento?: number
  frequencia?: number
  observacoes?: string
}) {
  await requireAuth()
  await db.avaliacao.create({ data })
  revalidatePath("/configuracoes/avaliacoes")
}

export async function atualizarAvaliacao(id: number, data: {
  notaTecnica?: number
  notaFisica?: number
  notaComportamento?: number
  frequencia?: number
  observacoes?: string
}) {
  await requireAuth()
  await db.avaliacao.update({ where: { id }, data })
  revalidatePath("/configuracoes/avaliacoes")
}

export async function removerAvaliacao(id: number) {
  await requireAuth()
  await db.avaliacao.delete({ where: { id } })
  revalidatePath("/configuracoes/avaliacoes")
}
