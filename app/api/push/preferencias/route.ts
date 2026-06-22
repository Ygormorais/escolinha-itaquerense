export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

export async function GET() {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  const prefs = await db.notificacaoPreferencia.findUnique({ where: { responsavelId: session.responsavelId } })
  return NextResponse.json(prefs ?? { vencimento: true, pagamentoConfirmado: true, falta: false, convocacao: true, comunicado: true, avaliacao: true })
}

export async function PUT(req: Request) {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  const { vencimento, pagamentoConfirmado, falta, convocacao, comunicado, avaliacao } = await req.json()
  await db.notificacaoPreferencia.upsert({
    where: { responsavelId: session.responsavelId },
    create: { responsavelId: session.responsavelId, vencimento, pagamentoConfirmado, falta, convocacao, comunicado, avaliacao },
    update: { vencimento, pagamentoConfirmado, falta, convocacao, comunicado, avaliacao },
  })
  return NextResponse.json({ ok: true })
}
