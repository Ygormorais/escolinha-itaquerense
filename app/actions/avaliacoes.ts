"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { registrarLog } from "@/app/actions/log"

function validarNotas(d: {
  notaTecnica?: number
  notaFisica?: number
  notaComportamento?: number
  frequencia?: number
}): string | null {
  for (const v of [d.notaTecnica, d.notaFisica, d.notaComportamento]) {
    if (v !== undefined && (!Number.isFinite(v) || v < 0 || v > 10)) {
      return "Notas devem estar entre 0 e 10"
    }
  }
  if (d.frequencia !== undefined && (!Number.isFinite(d.frequencia) || d.frequencia < 0 || d.frequencia > 100)) {
    return "Frequência deve estar entre 0 e 100"
  }
  return null
}

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
  const erro = validarNotas(data)
  if (erro) return { error: erro }
  const av = await db.avaliacao.create({ data })
  const aluno = await db.aluno.findUnique({ where: { id: data.alunoId }, select: { nome: true } })
  await registrarLog("avaliacao_criada", `Avaliação criada — ${aluno?.nome ?? ""}`, { periodo: data.periodo, id: av.id })
  revalidatePath("/configuracoes/avaliacoes")
  revalidatePath("/avaliacoes")
}

export async function atualizarAvaliacao(id: number, data: {
  notaTecnica?: number
  notaFisica?: number
  notaComportamento?: number
  frequencia?: number
  observacoes?: string
}) {
  await requireAuth()
  const erro = validarNotas(data)
  if (erro) return { error: erro }
  await db.avaliacao.update({ where: { id }, data })
  await registrarLog("avaliacao_editada", `Avaliação ID ${id} atualizada`)
  revalidatePath("/configuracoes/avaliacoes")
  revalidatePath("/avaliacoes")
}

export async function removerAvaliacao(id: number) {
  await requireAuth()
  await db.avaliacao.delete({ where: { id } })
  await registrarLog("avaliacao_excluida", `Avaliação ID ${id} excluída`)
  revalidatePath("/configuracoes/avaliacoes")
  revalidatePath("/avaliacoes")
}
