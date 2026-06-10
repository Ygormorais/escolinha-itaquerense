export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.authenticated) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { id } = await params
  const alunoId = Number(id)
  if (!Number.isInteger(alunoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const aluno = await db.aluno.findUnique({
    where: { id: alunoId },
    select: {
      nome: true,
      turma: true,
      horario: true,
      responsavel: true,
      telefone: true,
      mensalidade: true,
      status: true,
      pagamentos: {
        select: { mesReferencia: true, valorRecebido: true, dataPagamento: true, formaPagamento: true },
        orderBy: { mesReferencia: "desc" },
        take: 100,
      },
      frequencias: {
        select: { data: true, presenca: true },
        orderBy: { data: "desc" },
        take: 200,
      },
    },
  })

  if (!aluno) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 })
  }

  return NextResponse.json(aluno)
}
