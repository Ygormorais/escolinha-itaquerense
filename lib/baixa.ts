import type { Prisma } from "@prisma/client"
import type { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { calcularHashRecibo, gerarCodigoVerificacao, gerarNumeroRecibo } from "@/lib/recibos"

/** Cliente do Prisma: o próprio `db` ou o `tx` de uma transação. */
export type ClienteRecibo = typeof db | Prisma.TransactionClient

export type DadosBaixa = {
  pagamentoId: number
  /** Valor recebido nesta baixa (em baixa parcial, só a parte paga agora). */
  valor: number
  formaPagamento: string
  dataPagamento: Date
  emitidoPor: string | null
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
