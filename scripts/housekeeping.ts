import { db } from "@/lib/db"

const LIMITE_DIAS_LOG = 90
const LIMITE_DIAS_MENSAGEM = 60
const LIMITE_DIAS_RESET_TOKEN = 7

async function housekeeping() {
  console.log("[housekeeping] Iniciando limpeza...")
  const limiteLog = new Date(Date.now() - LIMITE_DIAS_LOG * 86400000)
  const limiteMensagem = new Date(Date.now() - LIMITE_DIAS_MENSAGEM * 86400000)
  const limiteToken = new Date(Date.now() - LIMITE_DIAS_RESET_TOKEN * 86400000)

  const logCount = await db.log.deleteMany({ where: { createdAt: { lt: limiteLog } } })
  console.log(`[housekeeping] Logs antigos removidos: ${logCount.count}`)

  const msgCount = await db.whatsAppMensagem.deleteMany({ where: { createdAt: { lt: limiteMensagem } } })
  console.log(`[housekeeping] Mensagens antigas removidas: ${msgCount.count}`)

  const tokenCount = await db.resetToken.deleteMany({ where: { createdAt: { lt: limiteToken } } })
  console.log(`[housekeeping] Tokens expirados removidos: ${tokenCount.count}`)

  const orfaos = await db.solicitacao.findMany({
    where: {
      status: { in: ["pendente", "em_andamento"] },
      createdAt: { lt: new Date(Date.now() - 30 * 86400000) },
    },
  })
  if (orfaos.length) {
    await db.solicitacao.updateMany({
      where: { id: { in: orfaos.map((s) => s.id) } },
      data: { status: "recusada", resposta: "Solicitação arquivada automaticamente por inatividade." },
    })
    console.log(`[housekeeping] Solicitações órfãs arquivadas: ${orfaos.length}`)
  }

  console.log("[housekeeping] Concluído!")
}

housekeeping()
  .catch((err) => {
    console.error("[housekeeping] Erro:", err)
    process.exit(1)
  })
  .then(() => process.exit(0))
