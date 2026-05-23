"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { addMonths, setDate } from "date-fns"

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
  status: string
  observacoes?: string
}) {
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
      status: data.status,
      observacoes: data.observacoes ?? null,
    },
  })

  // Generate 12 monthly payments starting from matricula month
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

  revalidatePath("/alunos")
  revalidatePath("/")
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
    status: string
    observacoes?: string
  }
) {
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
      status: data.status,
      observacoes: data.observacoes ?? null,
    },
  })

  revalidatePath("/alunos")
  revalidatePath("/")
}

export async function inativarAluno(id: number) {
  await db.aluno.update({
    where: { id },
    data: { status: "Inativo" },
  })

  revalidatePath("/alunos")
  revalidatePath("/")
}

export async function reativarAluno(id: number) {
  await db.aluno.update({
    where: { id },
    data: { status: "Ativo" },
  })

  revalidatePath("/alunos")
  revalidatePath("/")
}
