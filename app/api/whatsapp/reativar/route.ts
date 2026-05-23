import { NextRequest, NextResponse } from "next/server"
import { unblockSession } from "@/lib/whatsapp/session"

export async function POST(req: NextRequest) {
  const { telefone } = await req.json()
  if (!telefone) return NextResponse.json({ error: "telefone obrigatório" }, { status: 400 })
  await unblockSession(telefone)
  return NextResponse.json({ ok: true })
}
