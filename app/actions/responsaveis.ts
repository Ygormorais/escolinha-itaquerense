"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function listarResponsaveis() {
  await requireAuth(["admin", "secretaria"])
  return db.responsavel.findMany({
    include: { _count: { select: { alunos: true } } },
    orderBy: { nome: "asc" },
  })
}

export async function criarResponsavel(data: {
  nome: string
  email: string
  telefone: string
  senha: string
  alunoIds?: number[]
}) {
  await requireAuth(["admin", "secretaria"])
  const email = data.email.trim().toLowerCase()
  const existing = await db.responsavel.findUnique({ where: { email } })
  if (existing) return { error: "Email já cadastrado" }

  const senha = bcrypt.hashSync(data.senha, 12)
  const responsavel = await db.responsavel.create({
    data: {
      nome: data.nome,
      email,
      telefone: data.telefone,
      senha,
      alunos: data.alunoIds?.length
        ? { connect: data.alunoIds.map((id) => ({ id })) }
        : undefined,
    },
  })
  revalidatePath("/configuracoes/responsaveis")
  return { success: true, id: responsavel.id }
}

export async function editarResponsavel(
  id: number,
  data: { nome?: string; email?: string; telefone?: string; ativo?: boolean; cpf?: string | null }
) {
  await requireAuth(["admin", "secretaria"])

  if (data.cpf === "") data = { ...data, cpf: null }

  if (data.cpf !== undefined && data.cpf !== null) {
    const cpfLimpo = data.cpf.replace(/\D/g, "")
    if (cpfLimpo.length !== 11) return { error: "CPF deve ter 11 dígitos" }
    const duplicado = await db.responsavel.findFirst({
      where: { cpf: cpfLimpo, NOT: { id } },
    })
    if (duplicado) return { error: "CPF já cadastrado para outro responsável" }
    data = { ...data, cpf: cpfLimpo }
  }

  await db.responsavel.update({ where: { id }, data })
  revalidatePath("/configuracoes/responsaveis")
  return { success: true }
}

export async function deletarResponsavel(id: number) {
  await requireAuth(["admin", "secretaria"])
  await db.responsavel.delete({ where: { id } })
  revalidatePath("/configuracoes/responsaveis")
  return { success: true }
}

export async function vincularAluno(responsavelId: number, alunoId: number) {
  await requireAuth(["admin", "secretaria"])
  await db.aluno.update({ where: { id: alunoId }, data: { responsavelId } })
  revalidatePath("/configuracoes/responsaveis")
  return { success: true }
}

export async function desvincularAluno(alunoId: number) {
  await requireAuth(["admin", "secretaria"])
  await db.aluno.update({ where: { id: alunoId }, data: { responsavelId: null } })
  revalidatePath("/configuracoes/responsaveis")
  return { success: true }
}
