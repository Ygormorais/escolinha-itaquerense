import { NextResponse } from "next/server"
import { runEnviarLembreteVencendo, runEnviarLembretesInadimplentes } from "@/lib/email-jobs"
import { runEnviarLembretesWhatsAppInadimplencia, runEnviarLembretesWhatsAppVencendo } from "@/lib/whatsapp-jobs"
import { getCronSecret, verifyBearerSecret } from "@/lib/env"

export async function GET(request: Request) {
  const secret = getCronSecret()
  if (!verifyBearerSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [emailInadimplentes, emailVencendo, waInadimplentes, waVencendo] = await Promise.all([
    runEnviarLembretesInadimplentes(),
    runEnviarLembreteVencendo(),
    runEnviarLembretesWhatsAppInadimplencia(),
    runEnviarLembretesWhatsAppVencendo(),
  ])

  return NextResponse.json({
    email: { inadimplentes: emailInadimplentes, vencendo: emailVencendo },
    whatsapp: { inadimplentes: waInadimplentes, vencendo: waVencendo },
    executadoEm: new Date().toISOString(),
  })
}
