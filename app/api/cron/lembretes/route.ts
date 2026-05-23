import { NextResponse } from "next/server"
import { enviarLembretesInadimplentes, enviarLembreteVencendo } from "@/app/actions/email"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const [inadimplentes, vencendo] = await Promise.all([
    enviarLembretesInadimplentes(),
    enviarLembreteVencendo(),
  ])

  return NextResponse.json({
    inadimplentes,
    vencendo,
    executadoEm: new Date().toISOString(),
  })
}
