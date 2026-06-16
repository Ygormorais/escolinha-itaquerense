"use server"

import { revalidatePath } from "next/cache"
import { addMonths, format } from "date-fns"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "./log"
import { dataValida } from "@/lib/utils"

export type ActionResult = { success: true } | { error: string }
export type AprovarResult = { success: true; alunoId: number } | { error: string }

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

  if (!dataValida(data.dataNascimento)) {
    return { error: "Data de nascimento inválida" }
  }
  const dataNasc = new Date(data.dataNascimento)

  // Endpoint público: só aceita caminhos de upload internos (vindos de
  // /api/upload/matricula). Descarta URLs arbitrárias/javascript: que o admin
  // clicaria no painel (phishing/XSS via href).
  const UPLOAD_RE = /^\/uploads\/matriculas\/[A-Za-z0-9._-]+$/
  const docsValidos = (data.documentos ?? []).filter(
    (d) => typeof d === "string" && UPLOAD_RE.test(d)
  )

  try {
    await db.preMatricula.create({
      data: {
        nomeAluno: data.nomeAluno.trim(),
        dataNascimento: dataNasc,
        turma: data.turma,
        horario: data.horario,
        nomeResponsavel: data.nomeResponsavel.trim(),
        telefone: data.telefone.trim(),
        email: data.email.trim(),
        documentos: docsValidos.length > 0 ? JSON.stringify(docsValidos) : null,
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

export async function aprovarPreMatricula(
  id: number,
  opts: { mensalidade: number; desconto?: number; meses?: number }
): Promise<AprovarResult> {
  await requireAuth()

  const mensalidade = Number(opts?.mensalidade)
  if (!Number.isFinite(mensalidade) || mensalidade < 0) {
    return { error: "Informe uma mensalidade válida" }
  }
  const descontoRaw = Number(opts?.desconto)
  const desconto = Number.isFinite(descontoRaw) && descontoRaw > 0 ? descontoRaw : 0

  const pre = await db.preMatricula.findUnique({ where: { id } })
  if (!pre) return { error: "Pré-matrícula não encontrada" }
  if (pre.status === "aprovada") return { error: "Pré-matrícula já aprovada" }

  try {
    const aluno = await db.$transaction(async (tx) => {
      let responsavelId: number | null = null
      if (pre.email?.trim()) {
        const resp = await tx.responsavel.findFirst({ where: { email: pre.email.trim() } })
        if (resp) responsavelId = resp.id
      }
      const novo = await tx.aluno.create({
        data: {
          nome: pre.nomeAluno,
          dataNascimento: pre.dataNascimento,
          turma: pre.turma,
          horario: pre.horario,
          responsavel: pre.nomeResponsavel,
          telefone: pre.telefone,
          email: pre.email,
          dataMatricula: new Date(),
          mensalidade,
          desconto,
          status: "Ativo",
          observacoes: pre.observacoes,
          responsavelId,
        },
      })
      await tx.preMatricula.update({ where: { id }, data: { status: "aprovada" } })
      const qtdMeses = Math.max(0, Math.min(12, Number(opts.meses ?? 0)))
      for (let i = 0; i < qtdMeses; i++) {
        const dataRef = addMonths(new Date(), i)
        const vencimento = new Date(dataRef.getFullYear(), dataRef.getMonth(), 10)
        await tx.pagamento.create({
          data: {
            alunoId: novo.id,
            mesReferencia: format(dataRef, "yyyy-MM"),
            dataVencimento: vencimento,
          },
        })
      }
      return novo
    })

    await registrarLog("matricula", "Pré-matrícula aprovada → aluno criado", {
      preMatriculaId: id,
      alunoId: aluno.id,
    })
    revalidatePath("/configuracoes/matriculas")
    revalidatePath("/pagamentos")
    return { success: true, alunoId: aluno.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao aprovar pré-matrícula" }
  }
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
