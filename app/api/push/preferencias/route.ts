export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

const DEFAULT_PREFS = {
  vencimento: true,
  pagamentoConfirmado: true,
  falta: false,
  convocacao: true,
  comunicado: true,
  avaliacao: true,
}

function normalizePrefs(input: Record<string, unknown>) {
  return {
    vencimento: typeof input.vencimento === "boolean" ? input.vencimento : DEFAULT_PREFS.vencimento,
    pagamentoConfirmado: typeof input.pagamentoConfirmado === "boolean" ? input.pagamentoConfirmado : DEFAULT_PREFS.pagamentoConfirmado,
    falta: typeof input.falta === "boolean" ? input.falta : DEFAULT_PREFS.falta,
    convocacao: typeof input.convocacao === "boolean" ? input.convocacao : DEFAULT_PREFS.convocacao,
    comunicado: typeof input.comunicado === "boolean" ? input.comunicado : DEFAULT_PREFS.comunicado,
    avaliacao: typeof input.avaliacao === "boolean" ? input.avaliacao : DEFAULT_PREFS.avaliacao,
  }
}

export async function GET() {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  const prefs = await db.notificacaoPreferencia.findUnique({ where: { responsavelId: session.responsavelId } })
  return NextResponse.json(prefs ?? DEFAULT_PREFS)
}

export async function PUT(req: Request) {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const prefs = normalizePrefs(body)
  await db.notificacaoPreferencia.upsert({
    where: { responsavelId: session.responsavelId },
    create: { responsavelId: session.responsavelId, ...prefs },
    update: prefs,
  })
  return NextResponse.json({ ok: true })
}
