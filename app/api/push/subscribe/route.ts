export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

type SubscribePayload = {
  endpoint?: unknown
  keys?: { p256dh?: unknown; auth?: unknown }
}

export async function POST(req: Request) {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  let payload: SubscribePayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { endpoint, keys } = payload
  if (
    typeof endpoint !== "string" ||
    typeof keys?.p256dh !== "string" ||
    typeof keys?.auth !== "string" ||
    !endpoint.startsWith("https://")
  ) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { responsavelId: session.responsavelId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { responsavelId: session.responsavelId, p256dh: keys.p256dh, auth: keys.auth },
  })
  return NextResponse.json({ ok: true })
}
