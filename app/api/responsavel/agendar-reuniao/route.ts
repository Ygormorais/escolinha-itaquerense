import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { getConfig } from "@/lib/config"
import { createCalendarEvent } from "@/lib/google-calendar"

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

  const config = getConfig()

  const titulo = `Reunião: ${responsavel.nome}${alunoId ? ` - ${responsavel.alunos[0]?.nome ?? ""}` : ""}`
  const dataStr = data as string
  const horaInicioStr = (horaInicio as string) || "08:00"
  const horaFimStr = (horaFim as string) || "09:00"

  const descricao = `Solicitado por: ${responsavel.nome}\nAluno: ${responsavel.alunos[0]?.nome ?? "—"}\nMotivo: ${motivo}`

  const evento = await db.evento.create({
    data: {
      titulo,
      tipo: "Reunião",
      data: new Date(dataStr),
      horaInicio: horaInicioStr || null,
      horaFim: horaFimStr || null,
      descricao,
      local: "Escolinha Itaquerense",
    },
  })

  let googleEventLink: string | null = null
  if (config.googleCalendarId) {
    try {
      const gCalEvent = await createCalendarEvent({
        summary: titulo,
        description: descricao,
        startDateTime: `${dataStr}T${horaInicioStr.replace(":", "")}00-03:00`,
        endDateTime: `${dataStr}T${horaFimStr.replace(":", "")}00-03:00`,
        calendarId: config.googleCalendarId,
      })
      googleEventLink = gCalEvent?.htmlLink ?? null
    } catch {
      // Google Calendar falhou silenciosamente — evento salvo no banco de qualquer forma
    }
  }

  return NextResponse.json({ success: true, evento, googleEventLink })
}
