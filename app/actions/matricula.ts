"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export type ActionResult = { success: true } | { error: string }

export async function criarPreMatricula(data: {
  nomeAluno: string
  dataNascimento: string
  turma: string
  horario: string
  nomeResponsavel: string
  telefone: string
  email: string
  documentos?: string[]
  observacoes?: string
}): Promise<ActionResult> {
  if (!data.nomeAluno?.trim() || !data.nomeResponsavel?.trim() || !data.telefone?.trim()) {
    return { error: "Preencha os campos obrigatórios" }
  }

  try {
    await db.preMatricula.create({
      data: {
        nomeAluno: data.nomeAluno.trim(),
        dataNascimento: new Date(data.dataNascimento),
        turma: data.turma,
        horario: data.horario,
        nomeResponsavel: data.nomeResponsavel.trim(),
        telefone: data.telefone.trim(),
        email: data.email.trim(),
        documentos: data.documentos ? JSON.stringify(data.documentos) : null,
        observacoes: data.observacoes?.trim() || null,
        status: "pendente",
      },
    })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar pré-matrícula" }
  }
}

export async function listarPreMatriculas(status?: string) {
  await requireAuth()
  const where = status && status !== "todas" ? { status } : {}
  return db.preMatricula.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
}

export async function aprovarPreMatricula(id: number) {
  await requireAuth()
  await db.preMatricula.update({ where: { id }, data: { status: "aprovada" } })
  revalidatePath("/configuracoes/matriculas")
  return { success: true }
}

export async function recusarPreMatricula(id: number) {
  await requireAuth()
  await db.preMatricula.update({ where: { id }, data: { status: "recusada" } })
  revalidatePath("/configuracoes/matriculas")
  return { success: true }
}

export async function deletarPreMatricula(id: number) {
  await requireAuth()
  await db.preMatricula.delete({ where: { id } })
  revalidatePath("/configuracoes/matriculas")
  return { success: true }
}
