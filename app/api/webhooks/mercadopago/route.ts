export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { mpPayment, mpStatusToLocal, type MpPaymentStatus } from "@/lib/mercadopago"
import { revalidatePath } from "next/cache"
import { requireEnv } from "@/lib/env"
import { logger } from "@/lib/logger"

function verifyMpSignature(req: Request, paymentId: string, rawTs: string): boolean {
  const secret = requireEnv("MERCADOPAGO_WEBHOOK_SECRET", "")
  if (!secret) return false

  const requestId = req.headers.get("x-request-id") ?? ""
  const signatureHeader = req.headers.get("x-signature") ?? ""

  const tsMatch = signatureHeader.match(/ts=(\d+)/)
  const v1Match = signatureHeader.match(/v1=([a-f0-9]+)/)

  if (!tsMatch || !v1Match) return false

  const ts = tsMatch[1]
  const providedHash = v1Match[1]

  if (ts !== rawTs) return false

  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`
  const expectedHash = createHmac("sha256", secret).update(manifest).digest("hex")

  try {
    return timingSafeEqual(Buffer.from(expectedHash), Buffer.from(providedHash))
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  const t0 = performance.now()
  const signatureHeader = req.headers.get("x-signature")
  if (!signatureHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  if (body.type !== "payment") {
    return NextResponse.json({ ok: true })
  }

  const paymentId = String(body.data?.id ?? "")
  const tsMatch = signatureHeader.match(/ts=(\d+)/)
  const rawTs = tsMatch?.[1] ?? ""

  if (!verifyMpSignature(req, paymentId, rawTs)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const mpData = await mpPayment.get({ id: body.data?.id })
    if (!mpData?.id) return NextResponse.json({ ok: true })

    const pagamento = await db.pagamento.findFirst({
      where: { externalId: String(mpData.id) },
      include: {
        aluno: {
          select: { nome: true, telefone: true, email: true, responsavel: true },
        },
      },
    })

    if (!pagamento) return NextResponse.json({ ok: true })

    // idempotência: webhooks do MP são reentregues; só notifica na transição p/ pago
    const jaPago = pagamento.dataPagamento != null
    const statusLocal = mpStatusToLocal(mpData.status as MpPaymentStatus)
    const updateData: Record<string, unknown> = { statusCobranca: statusLocal }

    if (statusLocal === "pago") {
      updateData.dataPagamento = mpData.date_approved
        ? new Date(mpData.date_approved as string)
        : new Date()
      updateData.valorRecebido = mpData.transaction_amount
      updateData.formaPagamento = pagamento.canalPrevisto
    }

    await db.pagamento.update({ where: { id: pagamento.id }, data: updateData })

    revalidatePath("/pagamentos")
    revalidatePath("/caixa/pix")
    revalidatePath("/caixa/boleto")
    revalidatePath("/inadimplencia")
    revalidatePath("/")

    if (statusLocal === "pago" && !jaPago) {
      const { notificarPagamentoConfirmado } = await import("@/lib/whatsapp-jobs")
      const { notificarPagamentoConfirmadoEmail } = await import("@/lib/email-jobs")
      void notificarPagamentoConfirmado(pagamento.id).catch((e) =>
        logger.warn("webhook/mercadopago: WhatsApp notification failed", { pagamentoId: pagamento.id, error: String(e) })
      )
      void notificarPagamentoConfirmadoEmail(pagamento.id).catch((e) =>
        logger.warn("webhook/mercadopago: email notification failed", { pagamentoId: pagamento.id, error: String(e) })
      )
    }

    logger.info("webhook/mercadopago: processado", {
      pagamentoId: pagamento.id, statusLocal, jaPago,
      durMs: Math.round(performance.now() - t0),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    logger.error("webhook/mercadopago: unhandled error", {
      error: String(e), durMs: Math.round(performance.now() - t0),
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
