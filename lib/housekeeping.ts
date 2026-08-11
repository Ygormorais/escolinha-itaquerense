import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { deleteMatriculaDocuments, deleteOrphanMatriculaDocuments } from "@/lib/matricula-files"

const LIMITE_DIAS_LOG = 90
const LIMITE_DIAS_MENSAGEM = 60
const LIMITE_DIAS_RESET_TOKEN = 7
const LIMITE_DIAS_SOLICITACAO = 30
const LIMITE_HORAS_UPLOAD_ORFAO = 24
const LIMITE_DIAS_PRE_PENDENTE = 90
const LIMITE_DIAS_PRE_RECUSADA = 30
const LIMITE_DIAS_PRE_APROVADA = 90

export async function runHousekeeping(): Promise<{
  logsRemovidos: number
  mensagensRemovidas: number
  tokensRemovidos: number
  solicitacoesArquivadas: number
  classificacoesInvalidasRemovidas: number
  preMatriculasRemovidas: number
  documentosOrfaosRemovidos: number
}> {
  const t0 = performance.now()
  const limiteLog = new Date(Date.now() - LIMITE_DIAS_LOG * 86_400_000)
  const limiteMensagem = new Date(Date.now() - LIMITE_DIAS_MENSAGEM * 86_400_000)
  const limiteToken = new Date(Date.now() - LIMITE_DIAS_RESET_TOKEN * 86_400_000)
  const limiteSolicitacao = new Date(Date.now() - LIMITE_DIAS_SOLICITACAO * 86_400_000)

  const [logs, mensagens, tokens, orfaos, classificacoes, preMatriculas] = await Promise.all([
    db.log.deleteMany({ where: { createdAt: { lt: limiteLog } } }),
    db.whatsAppMensagem.deleteMany({ where: { createdAt: { lt: limiteMensagem } } }),
    db.resetToken.deleteMany({ where: { createdAt: { lt: limiteToken } } }),
    db.solicitacao.findMany({
      where: { status: { in: ["pendente", "em_andamento"] }, createdAt: { lt: limiteSolicitacao } },
      select: { id: true },
    }),
    db.classificacaoFpfs.deleteMany({
      where: {
        OR: [
          { fase: { startsWith: "JOGO" } },
          { fase: { startsWith: "jogo" } },
          { fase: { startsWith: "Jogo" } },
        ],
      },
    }),
    db.preMatricula.findMany({
      select: { id: true, documentos: true, status: true, createdAt: true, decididoEm: true },
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

  const agora = Date.now()
  let preMatriculasRemovidas = 0
  const preMatriculasExcluidas = new Set<number>()
  for (const pre of preMatriculas) {
    const dias = pre.status === "recusada"
      ? LIMITE_DIAS_PRE_RECUSADA
      : pre.status === "aprovada"
        ? LIMITE_DIAS_PRE_APROVADA
        : LIMITE_DIAS_PRE_PENDENTE
    const referencia = pre.status === "pendente" ? pre.createdAt : (pre.decididoEm ?? pre.createdAt)
    if (referencia.getTime() >= agora - dias * 86_400_000) continue
    try {
      await deleteMatriculaDocuments(pre.documentos)
      await db.preMatricula.delete({ where: { id: pre.id } })
      preMatriculasRemovidas++
      preMatriculasExcluidas.add(pre.id)
    } catch (error) {
      logger.error("cron/housekeeping: falha ao remover pré-matrícula expirada", {
        preMatriculaId: pre.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const documentosOrfaosRemovidos = await deleteOrphanMatriculaDocuments(
    preMatriculas
      .filter((pre) => !preMatriculasExcluidas.has(pre.id))
      .map((pre) => pre.documentos),
    new Date(agora - LIMITE_HORAS_UPLOAD_ORFAO * 3_600_000),
  )

  const resultado = {
    logsRemovidos: logs.count,
    mensagensRemovidas: mensagens.count,
    tokensRemovidos: tokens.count,
    solicitacoesArquivadas,
    classificacoesInvalidasRemovidas: classificacoes.count,
    preMatriculasRemovidas,
    documentosOrfaosRemovidos,
  }
  logger.info("cron/housekeeping: concluído", { ...resultado, durMs: Math.round(performance.now() - t0) })
  return resultado
}
