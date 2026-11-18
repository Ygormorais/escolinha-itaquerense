export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { can } from "@/lib/auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session.authenticated) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  // Financeiro é de admin/secretaria; o técnico recebe só os dados esportivos.
  const verFinanceiro = can(session.role, "secretaria")

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
      mensalidade: verFinanceiro,
      status: true,
      pagamentos: {
        select: { mesReferencia: true, valorRecebido: true, dataPagamento: true, formaPagamento: true },
        orderBy: { mesReferencia: "desc" },
        take: verFinanceiro ? 100 : 0,
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

  return NextResponse.json({ ...aluno, financeiro: verFinanceiro })
}
