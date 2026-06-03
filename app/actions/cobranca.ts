"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { mpPayment, mpStatusToLocal, type MpPaymentStatus } from "@/lib/mercadopago"

type Canal = "PIX" | "Boleto"
type ActionResult = { success: true } | { error: string }

export async function emitirCobranca(
  pagamentoId: number,
  canal: Canal
): Promise<ActionResult> {
  await requireAuth()

  const pagamento = await db.pagamento.findUnique({
    where: { id: pagamentoId },
    include: { aluno: { select: { nome: true, mensalidade: true, email: true } } },
  })

  if (!pagamento) return { error: "Pagamento não encontrado." }
  if (pagamento.externalId) return { error: "Cobrança já emitida para este pagamento." }

  try {
    const paymentType = canal === "PIX" ? "pix" : "bolbradesco"

    const response = await mpPayment.create({
      body: {
        transaction_amount: pagamento.aluno.mensalidade,
        description: `Mensalidade ${pagamento.mesReferencia} — ${pagamento.aluno.nome}`,
        payment_method_id: paymentType,
        payer: {
          email: pagamento.aluno.email ?? "responsavel@escolinha.com",
        },
        date_of_expiration: new Date(pagamento.dataVencimento).toISOString(),
      },
    })

    const data: Record<string, string | null> = {
      canalPrevisto: canal,
      statusCobranca: mpStatusToLocal(response.status as MpPaymentStatus),
      externalId: String(response.id),
      externalUrl: null,
      linhaDigitavel: null,
      pixCopiaECola: null,
    }

    if (canal === "PIX") {
      const txData = response.point_of_interaction?.transaction_data
      data.pixCopiaECola = txData?.qr_code ?? null
      data.externalUrl = txData?.ticket_url ?? null
    } else {
      data.linhaDigitavel = response.barcode?.content ?? null
      data.externalUrl = response.transaction_details?.external_resource_url ?? null
    }

    await db.pagamento.update({ where: { id: pagamentoId }, data })

    await registrarLog(
      "cobranca_emitida",
      `Cobrança ${canal} emitida — ${pagamento.aluno.nome}`,
      { mes: pagamento.mesReferencia, externalId: String(response.id) }
    )

    revalidatePath("/pagamentos")
    revalidatePath("/caixa/pix")
    revalidatePath("/caixa/boleto")
    revalidatePath("/inadimplencia")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao emitir cobrança no Mercado Pago." }
  }
}

export async function emitirCobrancasMes(
  mes: string,
  canal: Canal
): Promise<{ emitidos: number; erros: number } | { error: string }> {
  await requireAuth()

  const pendentes = await db.pagamento.findMany({
    where: { mesReferencia: mes, dataPagamento: null, externalId: null },
    select: { id: true },
  })

  let emitidos = 0
  let erros = 0

  for (const p of pendentes) {
    const res = await emitirCobranca(p.id, canal)
    if ("success" in res) emitidos++
    else erros++
  }

  return { emitidos, erros }
}

export async function cancelarCobranca(
  pagamentoId: number
): Promise<ActionResult> {
  await requireAuth()

  const pagamento = await db.pagamento.findUnique({
    where: { id: pagamentoId },
    include: { aluno: { select: { nome: true } } },
  })

  if (!pagamento) return { error: "Pagamento não encontrado." }
  if (!pagamento.externalId) return { error: "Nenhuma cobrança emitida." }

  try {
    const externalIdAnterior = pagamento.externalId
    await mpPayment.cancel({ id: externalIdAnterior })

    await db.pagamento.update({
      where: { id: pagamentoId },
      data: {
        statusCobranca: "cancelado",
        externalId: null,
        linhaDigitavel: null,
        pixCopiaECola: null,
        externalUrl: null,
      },
    })

    await registrarLog(
      "cobranca_cancelada",
      `Cobrança cancelada — ${pagamento.aluno.nome}`,
      { externalId: externalIdAnterior }
    )

    revalidatePath("/pagamentos")
    revalidatePath("/caixa/pix")
    revalidatePath("/caixa/boleto")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao cancelar cobrança." }
  }
}
