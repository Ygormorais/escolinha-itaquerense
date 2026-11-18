import type { Prisma } from "@prisma/client"
import type { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { calcularHashRecibo, gerarCodigoVerificacao, gerarNumeroRecibo } from "@/lib/recibos"
import { valorDevidoDoPagamento } from "@/lib/valor-devido"

const arredondar = (n: number) => Math.round(n * 100) / 100

type PagamentoParaBaixa = {
  id: number
  valorRecebido: number | null
  valorDevido: number | null
  observacoes?: string | null
  aluno: { mensalidade: number; desconto: number }
}

/** Acumulado após uma baixa e se ela quita a mensalidade (tolerância de meio centavo). */
export function calcularBaixa(p: PagamentoParaBaixa, valor: number): { valor: number; acumulado: number; quitada: boolean } {
  const v = arredondar(valor)
  const acumulado = arredondar((p.valorRecebido ?? 0) + v)
  return { valor: v, acumulado, quitada: acumulado + 0.005 >= valorDevidoDoPagamento(p) }
}

/**
 * Grava uma baixa somando ao já recebido. A condição sobre o acumulado lido faz duas baixas
 * simultâneas não se sobrescreverem: só uma aplica. `nota` é anexada às observações.
 */
export async function gravarBaixa(
  client: ClienteRecibo,
  p: PagamentoParaBaixa,
  dados: { valor: number; formaPagamento: string; dataPagamento: Date; nota?: string | null },
): Promise<{ aplicada: boolean; quitada: boolean; acumulado: number }> {
  const { acumulado, quitada } = calcularBaixa(p, dados.valor)
  const { count } = await client.pagamento.updateMany({
    where: { id: p.id, dataPagamento: null, valorRecebido: p.valorRecebido },
    data: {
      valorRecebido: acumulado,
      formaPagamento: dados.formaPagamento,
      canalPrevisto: dados.formaPagamento,
      statusCobranca: quitada ? "pago" : "parcial",
      ...(quitada ? { dataPagamento: dados.dataPagamento } : {}),
      ...(dados.nota ? { observacoes: p.observacoes ? `${p.observacoes}\n${dados.nota}` : dados.nota } : {}),
    },
  })
  return { aplicada: count === 1, quitada, acumulado }
}

/**
 * Baixa integral por outro canal: cancela no Mercado Pago o Pix/boleto ainda ativo, para a
 * família não pagar em duplicidade. Se o cancelamento falhar, mantém o externalId: o webhook
 * então registra o pagamento duplicado para estorno.
 */
export async function encerrarCobrancaAtiva(client: ClienteRecibo, pagamentoId: number): Promise<void> {
  const pag = await client.pagamento.findUnique({ where: { id: pagamentoId }, select: { externalId: true } })
  if (!pag?.externalId) return
  try {
    const { mpPayment } = await import("@/lib/mercadopago")
    await mpPayment.cancel({ id: pag.externalId })
    await client.pagamento.updateMany({
      where: { id: pagamentoId, externalId: pag.externalId },
      data: { externalId: null, linhaDigitavel: null, pixCopiaECola: null, externalUrl: null },
    })
  } catch (e) {
    logger.warn("baixa: não foi possível cancelar a cobrança ativa no Mercado Pago", {
      pagamentoId, externalId: pag.externalId, error: String(e),
    })
  }
}

/** Cliente do Prisma: o próprio `db` ou o `tx` de uma transação. */
export type ClienteRecibo = typeof db | Prisma.TransactionClient

export type DadosBaixa = {
  pagamentoId: number
  /** Valor recebido nesta baixa (em baixa parcial, só a parte paga agora). */
  valor: number
  formaPagamento: string
  dataPagamento: Date
  emitidoPor: string | null
  /** Transação do extrato OFX que originou a baixa, se houver. */
  fitidOfx?: string | null
}

/**
 * Recibo de uma baixa de mensalidade. Todos os caminhos que dão baixa (central, lote,
 * extrato, dinheiro, maquininha, Mercado Pago) chamam esta função.
 */
export async function emitirReciboDaBaixa(
  client: ClienteRecibo,
  dados: DadosBaixa,
): Promise<{ id: number; numero: string; codigoVerificacao: string }> {
  const pagamento = await client.pagamento.findUniqueOrThrow({
    where: { id: dados.pagamentoId },
    select: {
      id: true,
      alunoId: true,
      mesReferencia: true,
      aluno: { select: { nome: true, responsavel: true, responsavelRef: { select: { nome: true } } } },
    },
  })
  const numero = gerarNumeroRecibo()
  const codigoVerificacao = gerarCodigoVerificacao()
  const conteudo = {
    numero,
    codigoVerificacao,
    alunoNome: pagamento.aluno.nome,
    responsavel: pagamento.aluno.responsavelRef?.nome ?? pagamento.aluno.responsavel,
    mesReferencia: pagamento.mesReferencia,
    valor: dados.valor,
    formaPagamento: dados.formaPagamento,
    dataPagamento: dados.dataPagamento,
  }
  const recibo = await client.recibo.create({
    data: {
      ...conteudo,
      hashIntegridade: calcularHashRecibo(conteudo),
      emitidoPor: dados.emitidoPor,
      fitidOfx: dados.fitidOfx ?? null,
      pagamentoId: pagamento.id,
      alunoId: pagamento.alunoId,
    },
    select: { id: true },
  })
  return { id: recibo.id, numero, codigoVerificacao }
}

/**
 * Como emitirReciboDaBaixa, mas nunca lança: a baixa já foi gravada e não pode ser desfeita
 * por falha no recibo. Devolve null e registra o erro.
 */
export async function emitirReciboSeguro(
  client: ClienteRecibo,
  dados: DadosBaixa,
): Promise<{ id: number; numero: string; codigoVerificacao: string } | null> {
  try {
    return await emitirReciboDaBaixa(client, dados)
  } catch (e) {
    logger.error("recibo: falha ao emitir recibo da baixa", { pagamentoId: dados.pagamentoId, error: String(e) })
    return null
  }
}

/** Cancela (sem apagar) os recibos ativos de um pagamento; devolve quantos foram cancelados. */
export async function cancelarRecibosDoPagamento(
  client: ClienteRecibo,
  pagamentoId: number,
  canceladoPor: string | null,
): Promise<number> {
  const { count } = await client.recibo.updateMany({
    where: { pagamentoId, canceladoAt: null },
    data: { canceladoAt: new Date(), canceladoPor },
  })
  return count
}
