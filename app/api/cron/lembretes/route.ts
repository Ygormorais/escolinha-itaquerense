import { NextResponse } from "next/server"
import { runEnviarLembreteVencendo, runEnviarLembretesInadimplentes } from "@/lib/email-jobs"
import { getCronSecret, verifyBearerSecret } from "@/lib/env"

export async function GET(request: Request) {
  const secret = getCronSecret()
  if (!verifyBearerSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [inadimplentes, vencendo] = await Promise.all([
    runEnviarLembretesInadimplentes(),
    runEnviarLembreteVencendo(),
  ])

  return NextResponse.json({
    inadimplentes,
    vencendo,
    executadoEm: new Date().toISOString(),
  })
}
