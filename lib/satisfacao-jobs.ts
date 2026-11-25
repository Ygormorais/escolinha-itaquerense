import { db } from "@/lib/db"
import { hojeNoClube } from "@/lib/datas-clube"
import { logger } from "@/lib/logger"
import { sendPushToResponsavel } from "@/lib/push"
import { deveEnviarLembrete } from "@/lib/satisfacao"

export type ResultadoLembretePesquisa = { campanhas: number; enviados: number }

/**
 * Lembrete único da pesquisa de satisfação por notificação push, nos últimos dias da campanha e
 * só se o admin ligou o lembrete. Vai para famílias com atleta ativo que ainda não responderam
 * (quem não ativou push, ou desligou "comunicado", simplesmente não recebe). O título e o texto
 * não levam dado pessoal.
 */
export async function runLembretePesquisaSatisfacao(agora: Date = new Date()): Promise<ResultadoLembretePesquisa | { error: string }> {
  const t0 = performance.now()
  try {
    const hoje = hojeNoClube(agora)
    const abertas = await db.pesquisaSatisfacao.findMany({
      where: { encerradaEm: null, lembrete: true, lembreteEnviadoEm: null },
      select: { id: true, titulo: true, inicio: true, fim: true, encerradaEm: true, lembrete: true, lembreteEnviadoEm: true },
    })
    const devidas = abertas.filter((c) => deveEnviarLembrete(c, hoje))
    let enviados = 0
    for (const campanha of devidas) {
      // Marca antes de enviar: uma falha no meio não pode virar reenvio na próxima execução do cron.
      const { count } = await db.pesquisaSatisfacao.updateMany({ where: { id: campanha.id, lembreteEnviadoEm: null }, data: { lembreteEnviadoEm: agora } })
      if (count === 0) continue
      const pendentes = await db.responsavel.findMany({
        where: { ativo: true, alunos: { some: { status: "Ativo" } }, respostasSatisfacao: { none: { pesquisaId: campanha.id } } },
        select: { id: true },
      })
      for (const { id } of pendentes) {
        await sendPushToResponsavel(id, "comunicado", {
          title: "Sua opinião vale muito",
          body: `${campanha.titulo}: responda em menos de 1 minuto.`,
          url: "/responsavel/pesquisa",
        })
        enviados++
      }
    }
    logger.info("cron/pesquisa-satisfacao: concluído", { campanhas: devidas.length, enviados, durMs: Math.round(performance.now() - t0) })
    return { campanhas: devidas.length, enviados }
  } catch (e) {
    logger.error("cron/pesquisa-satisfacao: erro", { error: String(e), durMs: Math.round(performance.now() - t0) })
    return { error: e instanceof Error ? e.message : "Erro ao enviar lembrete da pesquisa" }
  }
}
