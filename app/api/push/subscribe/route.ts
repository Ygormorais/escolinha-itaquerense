export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

export async function POST(req: Request) {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { responsavelId: session.responsavelId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { p256dh: keys.p256dh, auth: keys.auth },
  })
  return NextResponse.json({ ok: true })
}
