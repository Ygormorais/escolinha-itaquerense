import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"
import { mpPayment, mpStatusToLocal, type MpPaymentStatus } from "@/lib/mercadopago"
import { revalidatePath } from "next/cache"
import { requireEnv } from "@/lib/env"

function verifyMpSignature(req: Request, paymentId: string, rawTs: string): boolean {
  const secret = requireEnv("MERCADOPAGO_WEBHOOK_SECRET", "")
  if (!secret) return process.env.NODE_ENV !== "production"

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

    if (statusLocal === "pago") {
      const { notificarPagamentoConfirmado } = await import("@/lib/whatsapp-jobs")
      const { notificarPagamentoConfirmadoEmail } = await import("@/lib/email-jobs")
      void notificarPagamentoConfirmado(pagamento.id).catch((e) =>
        console.warn("[webhook/mercadopago] WhatsApp notification failed:", e)
      )
      void notificarPagamentoConfirmadoEmail(pagamento.id).catch((e) =>
        console.warn("[webhook/mercadopago] Email notification failed:", e)
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[webhook/mercadopago]", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
