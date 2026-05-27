import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

export async function POST(req: NextRequest) {
  const session = await getResponsavelSession()
  if (!session.authenticated) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { alunoId, data, horaInicio, horaFim, motivo } = await req.json()

  if (!data || !motivo) {
    return NextResponse.json({ error: "Data e motivo são obrigatórios" }, { status: 400 })
  }

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: { alunos: { where: alunoId ? { id: Number(alunoId) } : undefined } },
  })
  if (!responsavel) {
    return NextResponse.json({ error: "Responsável não encontrado" }, { status: 404 })
  }

  const titulo = `Reunião: ${responsavel.nome}${alunoId ? ` - ${responsavel.alunos[0]?.nome ?? ""}` : ""}`

  const evento = await db.evento.create({
    data: {
      titulo,
      tipo: "Reunião",
      data: new Date(data),
      horaInicio: horaInicio || null,
      horaFim: horaFim || null,
      descricao: `Solicitado por: ${responsavel.nome}\nAluno: ${responsavel.alunos[0]?.nome ?? "—"}\nMotivo: ${motivo}`,
      local: "Escolinha Itaquerense",
    },
  })

  return NextResponse.json({ success: true, evento })
}
