import { db } from "@/lib/db"
import { sendPushToResponsavel } from "@/lib/push"
import { differenceInDays } from "date-fns"

export type ResultadoPush = { enviados: number; semCadastro: number }

/** Push para responsáveis com mensalidade vencendo nos próximos 3 dias. */
export async function runPushVencimento(): Promise<ResultadoPush | { error: string }> {
  try {
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 3)

    const vencendo = await db.pagamento.findMany({
      where: {
        dataPagamento: null,
        dataVencimento: { gte: new Date(), lte: amanha },
      },
      include: {
        aluno: { select: { nome: true, responsavelId: true, mensalidade: true } },
      },
    })

    let enviados = 0
    let semCadastro = 0

    for (const p of vencendo) {
      const responsavelId = p.aluno.responsavelId
      if (!responsavelId) { semCadastro++; continue }
      await sendPushToResponsavel(responsavelId, "vencimento", {
        title: "Mensalidade vencendo",
        body: `A mensalidade de ${p.aluno.nome} referente a ${p.mesReferencia} vence em breve.`,
        url: "/responsavel/mensalidades",
      })
      enviados++
    }

    return { enviados, semCadastro }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar push de vencimento" }
  }
}

/** Push para responsáveis com mensalidade em atraso. */
export async function runPushInadimplentes(): Promise<ResultadoPush | { error: string }> {
  try {
    const inadimplentes = await db.pagamento.findMany({
      where: { dataPagamento: null, dataVencimento: { lt: new Date() } },
      include: {
        aluno: { select: { nome: true, responsavelId: true } },
      },
    })

    let enviados = 0
    let semCadastro = 0

    for (const p of inadimplentes) {
      const responsavelId = p.aluno.responsavelId
      if (!responsavelId) { semCadastro++; continue }
      const dias = differenceInDays(new Date(), p.dataVencimento)
      await sendPushToResponsavel(responsavelId, "vencimento", {
        title: "Mensalidade em atraso",
        body: `Mensalidade de ${p.aluno.nome} (${p.mesReferencia}) está ${dias} dia(s) em atraso.`,
        url: "/responsavel/mensalidades",
      })
      enviados++
    }

    return { enviados, semCadastro }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar push de inadimplência" }
  }
}
