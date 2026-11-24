import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { enviarEmail, getErroConfiguracaoEmail } from "@/lib/mailer"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"
import { logger } from "@/lib/logger"
import { escapeHtml } from "@/lib/utils"
import { dataDeAmanha, mensagemDaAula, rotuloDia } from "@/lib/aula-experimental"
import { normalizarTelefoneBR } from "@/lib/whatsapp-modelos"

export type ResultadoLembreteAula = {
  /** Inscrições com aula amanhã que ainda não tinham lembrete. */
  candidatas: number
  whatsapp: number
  email: number
  /** Sem nenhum canal disponível (WhatsApp ou e-mail não configurado, ou contato ausente): tenta de novo no próximo ciclo. */
  semCanal: number
  erros: number
}

function whatsappConfigurado(): boolean {
  return Boolean(process.env.EVOLUTION_API_KEY?.trim())
}

/**
 * Lembrete na véspera da aula experimental: WhatsApp (se a Evolution API estiver configurada) e/ou
 * e-mail (se o SMTP estiver configurado e a família informou e-mail). Nada configurado não é erro:
 * o job só conta `semCanal`. A inscrição só é marcada como lembrada se um canal entregou, e o log
 * guarda apenas ids e contagens (sem nome nem contato).
 */
export async function runEnviarLembretesAulaExperimental(agora: Date = new Date()): Promise<ResultadoLembreteAula> {
  const resultado: ResultadoLembreteAula = { candidatas: 0, whatsapp: 0, email: 0, semCanal: 0, erros: 0 }

  const aulas = await db.aulaExperimental.findMany({
    where: { status: "agendada", lembreteEnviadoEm: null, janela: { data: dataDeAmanha(agora), ativa: true } },
    include: { janela: true },
  })
  resultado.candidatas = aulas.length
  if (aulas.length === 0) return resultado

  const config = getConfig()
  const podeWhatsApp = whatsappConfigurado()
  const podeEmail = getErroConfiguracaoEmail() === null

  for (const aula of aulas) {
    let entregue = false
    const mensagem = mensagemDaAula(aula, aula.janela, config.nome, config.modelosMensagem)

    const telefone = normalizarTelefoneBR(aula.telefone)
    if (podeWhatsApp && telefone) {
      try {
        await getWhatsAppProvider().sendText({ telefone, mensagem })
        await db.whatsAppMensagem
          .create({
            data: { telefone, mensagem, origem: "lembrete-aula-experimental", direcao: "outgoing", status: "sent", instancia: "escolinha" },
          })
          .catch(() => null)
        resultado.whatsapp++
        entregue = true
      } catch (e) {
        resultado.erros++
        logger.warn("cron: falha no WhatsApp da aula experimental", { aulaId: aula.id, error: String(e) })
      }
    }

    if (podeEmail && aula.email) {
      try {
        const j = aula.janela
        const html = `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="margin:0 0 12px">${escapeHtml(config.nome)}</h2>
            <p>Olá, <strong>${escapeHtml(aula.nomeResponsavel)}</strong>!</p>
            <p>Lembramos que a aula experimental de <strong>${escapeHtml(aula.nomeAtleta)}</strong> é amanhã:</p>
            <p><strong>${escapeHtml(rotuloDia(j.data))}</strong>, às <strong>${escapeHtml(j.hora)}</strong> (turma ${escapeHtml(j.turma)})${j.local ? `<br>Local: ${escapeHtml(j.local)}` : ""}</p>
            <p>Chegue uns 10 minutos antes, com roupa de treino e garrafinha de água. Se não puder vir, responda este e-mail ou fale com a secretaria.</p>
          </div>`
        await enviarEmail(aula.email, `Lembrete: aula experimental amanhã — ${config.nome}`, html)
        resultado.email++
        entregue = true
      } catch (e) {
        resultado.erros++
        logger.warn("cron: falha no e-mail da aula experimental", { aulaId: aula.id, error: String(e) })
      }
    }

    if (entregue) {
      await db.aulaExperimental.update({ where: { id: aula.id }, data: { lembreteEnviadoEm: new Date() } })
    } else {
      resultado.semCanal++
    }
  }

  logger.info("cron/aula-experimental: concluído", { ...resultado })
  return resultado
}
