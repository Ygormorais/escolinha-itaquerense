import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { mpPayment, mpStatusToLocal, type MpPaymentStatus } from "@/lib/mercadopago"
import { revalidatePath } from "next/cache"

export async function POST(req: Request) {
  const signature = req.headers.get("x-signature")
  if (!signature) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  if (body.type !== "payment") {
    return NextResponse.json({ ok: true })
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
      void notificarPagamentoConfirmado(pagamento.id).catch(() => null)
      void notificarPagamentoConfirmadoEmail(pagamento.id).catch(() => null)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[webhook/mercadopago]", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
