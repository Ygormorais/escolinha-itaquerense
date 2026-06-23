import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

const LIMITE_DIAS_LOG = 90
const LIMITE_DIAS_MENSAGEM = 60
const LIMITE_DIAS_RESET_TOKEN = 7
const LIMITE_DIAS_SOLICITACAO = 30

export async function runHousekeeping(): Promise<{
  logsRemovidos: number
  mensagensRemovidas: number
  tokensRemovidos: number
  solicitacoesArquivadas: number
}> {
  const t0 = performance.now()
  const limiteLog = new Date(Date.now() - LIMITE_DIAS_LOG * 86_400_000)
  const limiteMensagem = new Date(Date.now() - LIMITE_DIAS_MENSAGEM * 86_400_000)
  const limiteToken = new Date(Date.now() - LIMITE_DIAS_RESET_TOKEN * 86_400_000)
  const limiteSolicitacao = new Date(Date.now() - LIMITE_DIAS_SOLICITACAO * 86_400_000)

  const [logs, mensagens, tokens, orfaos] = await Promise.all([
    db.log.deleteMany({ where: { createdAt: { lt: limiteLog } } }),
    db.whatsAppMensagem.deleteMany({ where: { createdAt: { lt: limiteMensagem } } }),
    db.resetToken.deleteMany({ where: { createdAt: { lt: limiteToken } } }),
    db.solicitacao.findMany({
      where: { status: { in: ["pendente", "em_andamento"] }, createdAt: { lt: limiteSolicitacao } },
      select: { id: true },
    }),
  ])

  let solicitacoesArquivadas = 0
  if (orfaos.length > 0) {
    await db.solicitacao.updateMany({
      where: { id: { in: orfaos.map((s) => s.id) } },
      data: { status: "recusada", resposta: "Arquivada automaticamente por inatividade." },
    })
    solicitacoesArquivadas = orfaos.length
  }

  const resultado = {
    logsRemovidos: logs.count,
    mensagensRemovidas: mensagens.count,
    tokensRemovidos: tokens.count,
    solicitacoesArquivadas,
  }
  logger.info("cron/housekeeping: concluído", { ...resultado, durMs: Math.round(performance.now() - t0) })
  return resultado
}
