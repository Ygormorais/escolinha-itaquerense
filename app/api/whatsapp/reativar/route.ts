export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { unblockSession } from "@/lib/whatsapp/session"
import { getEvolutionApiKey, verifyEvolutionAuth } from "@/lib/env"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  const apiKey = getEvolutionApiKey()
  if (!verifyEvolutionAuth(req, apiKey)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { telefone } = await req.json()
  if (!telefone) return NextResponse.json({ error: "telefone obrigatório" }, { status: 400 })

  try {
    await unblockSession(telefone)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === "P2025") {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }
    logger.error("whatsapp/reativar: erro ao desbloquear sessão", { telefone, error: String(err) })
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
