"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { addMonths, setDate } from "date-fns"
import { registrarLog } from "@/app/actions/log"
import { requireAuth } from "@/lib/auth"

type ActionResult = { success: true } | { error: string }

export async function createAluno(data: {
  nome: string
  dataNascimento: string
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: string
  mensalidade: number
  desconto?: number
  status: string
  observacoes?: string
}): Promise<ActionResult> {
  await requireAuth()
  try {
    const aluno = await db.aluno.create({
      data: {
        nome: data.nome,
        dataNascimento: new Date(data.dataNascimento),
        turma: data.turma,
        horario: data.horario,
        responsavel: data.responsavel,
        telefone: data.telefone,
        email: data.email,
        dataMatricula: new Date(data.dataMatricula),
        mensalidade: data.mensalidade,
        desconto: data.desconto ?? 0,
        status: data.status,
        observacoes: data.observacoes ?? null,
      },
    })

    const baseDate = new Date(data.dataMatricula)
    const pagamentos = Array.from({ length: 12 }, (_, i) => {
      const month = addMonths(baseDate, i)
      return {
        alunoId: aluno.id,
        mesReferencia: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
        dataVencimento: setDate(month, 10),
      }
    })
    await db.pagamento.createMany({ data: pagamentos })

    await registrarLog("aluno_novo", `Novo aluno cadastrado — ${data.nome}`, { turma: data.turma })
    revalidatePath("/alunos")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao cadastrar aluno" }
  }
}

export async function updateAluno(
  id: number,
  data: {
    nome: string
    dataNascimento: string
    turma: string
    horario: string
    responsavel: string
    telefone: string
    email: string
    dataMatricula: string
    mensalidade: number
    desconto?: number
    status: string
    observacoes?: string
  }
): Promise<ActionResult> {
  await requireAuth()
  try {
    await db.aluno.update({
      where: { id },
      data: {
        nome: data.nome,
        dataNascimento: new Date(data.dataNascimento),
        turma: data.turma,
        horario: data.horario,
        responsavel: data.responsavel,
        telefone: data.telefone,
        email: data.email,
        dataMatricula: new Date(data.dataMatricula),
        mensalidade: data.mensalidade,
        desconto: data.desconto ?? 0,
        status: data.status,
        observacoes: data.observacoes ?? null,
      },
    })

    revalidatePath("/alunos")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao atualizar aluno" }
  }
}

export async function inativarAluno(id: number): Promise<ActionResult> {
  await requireAuth()
  try {
    const aluno = await db.aluno.update({ where: { id }, data: { status: "Inativo" }, select: { nome: true, turma: true } })
    await registrarLog("aluno_inativo", `Aluno inativado — ${aluno.nome}`, { turma: aluno.turma })
    revalidatePath("/alunos")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao inativar aluno" }
  }
}

export async function reativarAluno(id: number): Promise<ActionResult> {
  await requireAuth()
  try {
    const aluno = await db.aluno.update({ where: { id }, data: { status: "Ativo" }, select: { nome: true, turma: true } })
    await registrarLog("aluno_reativo", `Aluno reativado — ${aluno.nome}`, { turma: aluno.turma })
    revalidatePath("/alunos")
    revalidatePath("/")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao reativar aluno" }
  }
}
