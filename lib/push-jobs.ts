import { db } from "@/lib/db"
import { sendPushToResponsavel } from "@/lib/push"
import { differenceInDays } from "date-fns"
import { logger } from "@/lib/logger"
import { inicioDeHojeUtc } from "@/lib/datas-clube"
import { restanteDoPagamento } from "@/lib/valor-devido"

export type ResultadoPush = { enviados: number; semCadastro: number }

/** Push para responsáveis com mensalidade vencendo nos próximos 3 dias. */
export async function runPushVencimento(): Promise<ResultadoPush | { error: string }> {
  const t0 = performance.now()
  try {
    const hoje = inicioDeHojeUtc()
    const ateTresDias = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Inclui quem vence hoje (vencimento à meia-noite UTC do dia).
    const vencendo = await db.pagamento.findMany({
      where: {
        dataPagamento: null,
        dataVencimento: { gte: hoje, lte: ateTresDias },
      },
      include: {
        aluno: { select: { nome: true, responsavelId: true, mensalidade: true, desconto: true } },
      },
    })

    let enviados = 0
    let semCadastro = 0

    for (const p of vencendo) {
      if (restanteDoPagamento(p) <= 0) continue
      const responsavelId = p.aluno.responsavelId
      if (!responsavelId) { semCadastro++; continue }
      await sendPushToResponsavel(responsavelId, "vencimento", {
        title: "Mensalidade vencendo",
        body: `A mensalidade de ${p.aluno.nome} referente a ${p.mesReferencia} vence em breve.`,
        url: "/responsavel/mensalidades",
      })
      enviados++
    }

    logger.info("cron/push-vencimento: concluído", { enviados, semCadastro, durMs: Math.round(performance.now() - t0) })
    return { enviados, semCadastro }
  } catch (e) {
    logger.error("cron/push-vencimento: erro", { error: String(e), durMs: Math.round(performance.now() - t0) })
    return { error: e instanceof Error ? e.message : "Erro ao enviar push de vencimento" }
  }
}

/** Push para responsáveis com mensalidade em atraso. */
export async function runPushInadimplentes(): Promise<ResultadoPush | { error: string }> {
  const t0 = performance.now()
  try {
    const inadimplentes = await db.pagamento.findMany({
      // Em atraso só a partir do dia seguinte ao vencimento.
      where: { dataPagamento: null, dataVencimento: { lt: inicioDeHojeUtc() } },
      include: {
        aluno: { select: { nome: true, responsavelId: true, mensalidade: true, desconto: true } },
      },
    })

    let enviados = 0
    let semCadastro = 0

    for (const p of inadimplentes) {
      if (restanteDoPagamento(p) <= 0) continue
      const responsavelId = p.aluno.responsavelId
      if (!responsavelId) { semCadastro++; continue }
      const dias = differenceInDays(inicioDeHojeUtc(), p.dataVencimento)
      await sendPushToResponsavel(responsavelId, "vencimento", {
        title: "Mensalidade em atraso",
        body: `Mensalidade de ${p.aluno.nome} (${p.mesReferencia}) está ${dias} dia(s) em atraso.`,
        url: "/responsavel/mensalidades",
      })
      enviados++
    }

    logger.info("cron/push-inadimplentes: concluído", { enviados, semCadastro, durMs: Math.round(performance.now() - t0) })
    return { enviados, semCadastro }
  } catch (e) {
    logger.error("cron/push-inadimplentes: erro", { error: String(e), durMs: Math.round(performance.now() - t0) })
    return { error: e instanceof Error ? e.message : "Erro ao enviar push de inadimplência" }
  }
}
