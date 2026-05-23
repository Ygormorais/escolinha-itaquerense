import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { routeMessage } from "@/lib/whatsapp/ai-router"

export async function POST(req: NextRequest) {
  const apiKey = process.env.EVOLUTION_API_KEY
  if (apiKey) {
    const auth = req.headers.get("apikey") || req.headers.get("authorization")?.replace("Bearer ", "")
    if (auth !== apiKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const body = await req.json()
    const { event, instance, data } = body

    if (event === "MESSAGE" && data?.key?.remoteJid) {
      const telefone = data.key.remoteJid.replace(/@s\.whatsapp\.net$/, "")
      const texto = data.message?.conversation || data.message?.extendedTextMessage?.text || ""
      const messageId = data.key.id

      if (!texto) return NextResponse.json({ ok: true })

      const aluno = await db.aluno.findFirst({
        where: { telefone: { contains: telefone.replace(/\D/g, "") } },
      })

      if (aluno) {
        await routeMessage(aluno.id, texto, telefone)
      } else {
        await db.whatsAppMensagem.create({
          data: {
            telefone,
            mensagem: texto,
            direcao: "incoming",
            status: "received",
            instancia: instance ?? "escolinha",
            origem: "webhook",
            messageId,
          },
        })
      }
    }

    if (event === "MESSAGE_STATUS" && data?.key?.id && data?.status) {
      const statusMap: Record<string, string> = {
        "READ": "read",
        "DELIVERED": "delivered",
        "RECEIVED": "received",
        "FAILED": "failed",
      }
      const status = statusMap[data.status] ?? data.status.toLowerCase()

      await db.whatsAppMensagem.updateMany({
        where: { messageId: data.key.id },
        data: { status },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("WhatsApp webhook error:", error)
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 })
  }
}
