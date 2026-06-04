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
    select: { telefone: true },
  })
  if (!responsavel) {
    return NextResponse.json({ error: "Responsável não encontrado" }, { status: 404 })
  }

  const telefone = responsavel.telefone?.replace(/\D/g, "")

  const [naoLidas, ultimas] = await Promise.all([
    db.whatsAppMensagem.count({
      where: {
        origem: "comunicado",
        lida: false,
        ...(telefone ? { telefone: { contains: telefone.slice(-8) } } : { telefone: "" }),
      },
    }),
    db.whatsAppMensagem.findMany({
      where: {
        origem: "comunicado",
        ...(telefone ? { telefone: { contains: telefone.slice(-8) } } : { telefone: "" }),
      },
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
    select: { telefone: true },
  })
  if (!responsavel) {
    return NextResponse.json({ error: "Responsável não encontrado" }, { status: 404 })
  }

  const telefone = responsavel.telefone?.replace(/\D/g, "")

  const where = {
    origem: "comunicado",
    lida: false,
    ...(telefone ? { telefone: { contains: telefone.slice(-8) } } : { telefone: "" }),
  }

  const updated = await db.whatsAppMensagem.updateMany({
    where,
    data: { lida: true },
  })

  return NextResponse.json({ marked: updated.count })
}
