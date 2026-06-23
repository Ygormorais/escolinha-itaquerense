export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { runEnviarLembreteVencendo, runEnviarLembretesInadimplentes } from "@/lib/email-jobs"
import { runEnviarLembretesWhatsAppInadimplencia, runEnviarLembretesWhatsAppVencendo, runEnviarParabensAniversariantes } from "@/lib/whatsapp-jobs"
import { getCronSecret, verifyBearerSecret } from "@/lib/env"
import { runHousekeeping } from "@/lib/housekeeping"
import { db } from "@/lib/db"
import { mpPayment, mpStatusToLocal, type MpPaymentStatus } from "@/lib/mercadopago"
import { revalidatePath } from "next/cache"
import { runGerarMensalidadesMes } from "@/lib/pagamentos-jobs"
import { runPushVencimento, runPushInadimplentes } from "@/lib/push-jobs"
import { sendPushToResponsavel } from "@/lib/push"
import { format } from "date-fns"
import { logger } from "@/lib/logger"

async function sincronizarStatusCobrancas(): Promise<{ atualizados: number }> {
  const pendentes = await db.pagamento.findMany({
    where: {
      statusCobranca: "pendente",
      dataVencimento: { lt: new Date() },
      externalId: { not: null },
    },
    select: {
      id: true,
      externalId: true,
      canalPrevisto: true,
      mesReferencia: true,
      aluno: { select: { nome: true, responsavelId: true } },
    },
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
        if (statusLocal === "pago" && p.aluno.responsavelId) {
          await sendPushToResponsavel(p.aluno.responsavelId, "pagamentoConfirmado", {
            title: "Pagamento confirmado!",
            body: `Mensalidade de ${p.aluno.nome} (${p.mesReferencia}) recebida com sucesso.`,
            url: "/responsavel/mensalidades",
          }).catch(() => null)
        }
        atualizados++
      }
    } catch (e) {
      logger.warn("cron: falha ao sincronizar pagamento MP", { pagamentoId: p.id, error: String(e) })
    }
  }

  revalidatePath("/pagamentos")
  revalidatePath("/inadimplencia")
  revalidatePath("/caixa")
  revalidatePath("/caixa/pix")
  revalidatePath("/caixa/boleto")
  revalidatePath("/caixa/recebimentos")

  return { atualizados }
}

export async function GET(request: Request) {
  const secret = getCronSecret()
  if (!verifyBearerSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const isDomingo = now.getDay() === 0

  const geracaoMensal =
    now.getDate() === 1
      ? await runGerarMensalidadesMes(format(now, "yyyy-MM")).catch((e: unknown) => ({
          error: e instanceof Error ? e.message : "Erro ao gerar mensalidades",
        }))
      : null

  const [emailInadimplentes, emailVencendo, waInadimplentes, waVencendo, waAniversarios, cobrancas, pushVencimento, pushInadimplentes] = await Promise.all([
    runEnviarLembretesInadimplentes(),
    runEnviarLembreteVencendo(),
    runEnviarLembretesWhatsAppInadimplencia(),
    runEnviarLembretesWhatsAppVencendo(),
    runEnviarParabensAniversariantes(),
    sincronizarStatusCobrancas(),
    runPushVencimento(),
    runPushInadimplentes(),
  ])

  const housekeeping = isDomingo ? await runHousekeeping() : null

  return NextResponse.json({
    email: { inadimplentes: emailInadimplentes, vencendo: emailVencendo },
    whatsapp: { inadimplentes: waInadimplentes, vencendo: waVencendo, aniversarios: waAniversarios },
    push: { vencimento: pushVencimento, inadimplentes: pushInadimplentes },
    cobrancas,
    housekeeping,
    geracaoMensal,
    executadoEm: new Date().toISOString(),
  })
}
