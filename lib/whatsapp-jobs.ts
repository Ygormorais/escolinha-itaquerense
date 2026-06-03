import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"

export async function runEnviarLembretesWhatsAppInadimplencia() {
  const config = getConfig()
  const erros = 0
  let semTelefone = 0

  const atrasadas = await db.pagamento.findMany({
    where: {
      dataPagamento: null,
      dataVencimento: { lt: new Date() },
    },
    include: {
      aluno: { select: { id: true, nome: true, telefone: true, responsavel: true, mensalidade: true } },
    },
  })

  for (const p of atrasadas) {
    const tel = p.aluno.telefone?.replace(/\D/g, "")
    if (!tel || tel.length < 8) { semTelefone++; continue }

    const mesesAtraso = Math.floor(
      (Date.now() - new Date(p.dataVencimento).getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    const msg = [
      `Olá ${p.aluno.responsavel?.split(" ")[0] ?? "responsável"}!`,
      ``,
      `Lembrete: a mensalidade de *${p.aluno.nome}* referente a *${p.mesReferencia}* está em atraso (${mesesAtraso} ${mesesAtraso === 1 ? "mês" : "meses"}).`,
      ``,
      `Valor: *R$ ${p.aluno.mensalidade.toFixed(2)}*`,
      config.chavePix ? `PIX: ${config.chavePix}` : ``,
      ``,
      `Qualquer dúvida, entre em contato.`,
    ].filter(Boolean).join("\n")

    try {
      await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
    } catch {
      // silently fail per student
    }
  }

  return { enviados: atrasadas.length - semTelefone, erros, semTelefone }
}

export async function runEnviarLembretesWhatsAppVencendo() {
  const config = getConfig()
  const erros = 0
  let semTelefone = 0

  const tresDias = new Date()
  tresDias.setDate(tresDias.getDate() + 3)

  const vencendo = await db.pagamento.findMany({
    where: {
      dataPagamento: null,
      dataVencimento: { gte: new Date(), lte: tresDias },
    },
    include: {
      aluno: { select: { id: true, nome: true, telefone: true, responsavel: true, mensalidade: true } },
    },
  })

  for (const p of vencendo) {
    const tel = p.aluno.telefone?.replace(/\D/g, "")
    if (!tel || tel.length < 8) { semTelefone++; continue }

    const dias = Math.ceil(
      (new Date(p.dataVencimento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    const msg = [
      `Olá ${p.aluno.responsavel?.split(" ")[0] ?? "responsável"}!`,
      ``,
      `A mensalidade de *${p.aluno.nome}* referente a *${p.mesReferencia}* vence em *${dias} ${dias === 1 ? "dia" : "dias"}* (${new Date(p.dataVencimento).toLocaleDateString("pt-BR")}).`,
      ``,
      `Valor: *R$ ${p.aluno.mensalidade.toFixed(2)}*`,
      config.chavePix ? `PIX: ${config.chavePix}` : ``,
    ].filter(Boolean).join("\n")

    try {
      await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
    } catch {
      // silently fail per student
    }
  }

  return { enviados: vencendo.length - semTelefone, erros, semTelefone }
}

export async function notificarPagamentoConfirmado(pagamentoId: number): Promise<void> {
  const p = await db.pagamento.findUnique({
    where: { id: pagamentoId },
    include: { aluno: { select: { nome: true, telefone: true, responsavel: true, mensalidade: true } } },
  })
  if (!p) return

  const tel = p.aluno.telefone?.replace(/\D/g, "")
  if (!tel || tel.length < 8) return

  const msg = [
    `Olá ${p.aluno.responsavel?.split(" ")[0] ?? "responsável"}!`,
    ``,
    `Pagamento confirmado! A mensalidade de *${p.aluno.nome}* referente a *${p.mesReferencia}* foi recebida com sucesso.`,
    ``,
    `Valor: *R$ ${(p.valorRecebido ?? p.aluno.mensalidade).toFixed(2)}*`,
    `Obrigado!`,
  ].join("\n")

  await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
}
