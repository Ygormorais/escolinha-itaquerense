export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

export async function GET() {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    select: { alunos: { select: { id: true } } },
  })
  if (!responsavel) {
    return NextResponse.json({ error: "Responsável não encontrado" }, { status: 404 })
  }

  // escopa pelos alunos do responsável (comunicados têm alunoId). Casar por
  // sufixo de telefone vazava comunicados personalizados entre famílias.
  const alunoIds = responsavel.alunos.map((a) => a.id)
  const filtroBase = { origem: "comunicado", alunoId: { in: alunoIds } }

  const [naoLidas, ultimas] = await Promise.all([
    db.whatsAppMensagem.count({ where: { ...filtroBase, lida: false } }),
    db.whatsAppMensagem.findMany({
      where: filtroBase,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        mensagem: true,
        lida: true,
        createdAt: true,
      },
    }),
  ])

  return NextResponse.json({
    naoLidas,
    ultimas: ultimas.map((c) => ({
      mensagem: c.mensagem,
      lida: c.lida,
      createdAt: c.createdAt.toISOString(),
    })),
  })
}

export async function PATCH() {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    select: { alunos: { select: { id: true } } },
  })
  if (!responsavel) {
    return NextResponse.json({ error: "Responsável não encontrado" }, { status: 404 })
  }

  const alunoIds = responsavel.alunos.map((a) => a.id)

  const updated = await db.whatsAppMensagem.updateMany({
    where: { origem: "comunicado", lida: false, alunoId: { in: alunoIds } },
    data: { lida: true },
  })

  return NextResponse.json({ marked: updated.count })
}
