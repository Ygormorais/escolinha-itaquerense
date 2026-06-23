"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { mpPayment, mpStatusToLocal, type MpPaymentStatus } from "@/lib/mercadopago"

type Canal = "PIX" | "Boleto"
type ActionResult = { success: true } | { error: string }

/**
 * O Mercado Pago rejeita date_of_expiration no passado (erro 2194).
 * Usa o vencimento (fim do dia) se ainda for futuro; senão, hoje + 3 dias.
 */
function calcularExpiracao(dataVencimento: Date): string {
  const venc = new Date(dataVencimento)
  venc.setHours(23, 59, 59, 0)
  const minimo = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  return (venc > minimo ? venc : minimo).toISOString()
}

/**
 * Boleto registrado exige endereço completo do pagador. Como o cadastro ainda
 * não coleta endereço por responsável, usamos o endereço da escola como padrão
 * (configurável por env). Trocar quando houver endereço no cadastro.
 */
const enderecoBoleto = {
  zip_code: process.env.ESCOLA_CEP ?? "01310100",
  street_name: process.env.ESCOLA_LOGRADOURO ?? "Avenida Paulista",
  street_number: process.env.ESCOLA_NUMERO ?? "1000",
  neighborhood: process.env.ESCOLA_BAIRRO ?? "Bela Vista",
  city: process.env.ESCOLA_CIDADE ?? "São Paulo",
  federal_unit: process.env.ESCOLA_UF ?? "SP",
}

export async function emitirCobranca(
  pagamentoId: number,
  canal: Canal
): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])

  const pagamento = await db.pagamento.findUnique({
    where: { id: pagamentoId },
    include: {
      aluno: {
        select: {
          nome: true,
          mensalidade: true,
          email: true,
          responsavel: true,
          responsavelRef: { select: { nome: true, email: true, cpf: true } },
        },
      },
    },
  })

  if (!pagamento) return { error: "Pagamento não encontrado." }
  if (pagamento.externalId) return { error: "Cobrança já emitida para este pagamento." }

  // O pagador é o responsável; cai para o aluno se não houver vínculo.
  const pagadorNome = pagamento.aluno.responsavelRef?.nome ?? pagamento.aluno.responsavel
  const pagadorEmail =
    pagamento.aluno.responsavelRef?.email ?? pagamento.aluno.email ?? "responsavel@escolinha.com"
  const cpf = pagamento.aluno.responsavelRef?.cpf?.replace(/\D/g, "") ?? null

  // Boleto registrado exige nome completo e CPF do pagador.
  if (canal === "Boleto" && !cpf) {
    return {
      error: "Boleto requer o CPF do responsável. Cadastre o CPF antes de emitir.",
    }
  }

  const [firstName, ...rest] = (pagadorNome ?? "Responsável").trim().split(/\s+/)
  const lastName = rest.join(" ") || firstName

  try {
    const paymentType = canal === "PIX" ? "pix" : "bolbradesco"

    const response = await mpPayment.create({
      body: {
        transaction_amount: pagamento.aluno.mensalidade,
        description: `Mensalidade ${pagamento.mesReferencia} — ${pagamento.aluno.nome}`,
        payment_method_id: paymentType,
        payer: {
          email: pagadorEmail,
          first_name: firstName,
          last_name: lastName,
          ...(cpf ? { identification: { type: "CPF", number: cpf } } : {}),
          ...(canal === "Boleto" ? { address: enderecoBoleto } : {}),
        },
        date_of_expiration: calcularExpiracao(pagamento.dataVencimento),
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
      type MpBoletoResp = { barcode?: { content?: string | null } }
      const boletoResp = response as unknown as MpBoletoResp
      data.linhaDigitavel =
        response.transaction_details?.digitable_line ??
        response.transaction_details?.barcode?.content ??
        boletoResp.barcode?.content ??
        null
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
  await requireAuth(["admin", "secretaria"])

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
  await requireAuth(["admin", "secretaria"])

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
