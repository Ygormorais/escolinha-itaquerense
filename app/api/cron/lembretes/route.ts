export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { runEnviarLembreteVencendo, runEnviarLembretesInadimplentes } from "@/lib/email-jobs"
import { runEnviarLembretesWhatsAppInadimplencia, runEnviarLembretesWhatsAppVencendo } from "@/lib/whatsapp-jobs"
import { getCronSecret, verifyBearerSecret } from "@/lib/env"
import { runHousekeeping } from "@/lib/housekeeping"
import { db } from "@/lib/db"
import { mpPayment, mpStatusToLocal, type MpPaymentStatus } from "@/lib/mercadopago"
import { revalidatePath } from "next/cache"

async function sincronizarStatusCobrancas(): Promise<{ atualizados: number }> {
  const pendentes = await db.pagamento.findMany({
    where: {
      statusCobranca: "pendente",
      dataVencimento: { lt: new Date() },
      externalId: { not: null },
    },
    select: { id: true, externalId: true, canalPrevisto: true },
  })

  let atualizados = 0

  for (const p of pendentes) {
    try {
      const mpData = await mpPayment.get({ id: p.externalId! })
      const statusLocal = mpStatusToLocal(mpData.status as MpPaymentStatus)

      if (statusLocal !== "pendente") {
        await db.pagamento.update({
          where: { id: p.id },
          data: {
            statusCobranca: statusLocal,
            ...(statusLocal === "pago"
              ? {
                  dataPagamento: new Date(mpData.date_approved as string),
                  valorRecebido: mpData.transaction_amount,
                  formaPagamento: p.canalPrevisto,
                }
              : {}),
          },
        })
        atualizados++
      }
    } catch {
      console.warn(`[cron] Falha ao sincronizar pagamento ${p.id}`)
    }
  }

  revalidatePath("/pagamentos")
  revalidatePath("/caixa/pix")
  revalidatePath("/caixa/boleto")

  return { atualizados }
}

export async function GET(request: Request) {
  const secret = getCronSecret()
  if (!verifyBearerSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isDomingo = new Date().getDay() === 0

  const [emailInadimplentes, emailVencendo, waInadimplentes, waVencendo, cobrancas] = await Promise.all([
    runEnviarLembretesInadimplentes(),
    runEnviarLembreteVencendo(),
    runEnviarLembretesWhatsAppInadimplencia(),
    runEnviarLembretesWhatsAppVencendo(),
    sincronizarStatusCobrancas(),
  ])

  const housekeeping = isDomingo ? await runHousekeeping() : null

  return NextResponse.json({
    email: { inadimplentes: emailInadimplentes, vencendo: emailVencendo },
    whatsapp: { inadimplentes: waInadimplentes, vencendo: waVencendo },
    cobrancas,
    housekeeping,
    executadoEm: new Date().toISOString(),
  })
}
