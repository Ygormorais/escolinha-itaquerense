import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"
import { formatMoney } from "@/lib/utils"
import { ehAniversarioNoDia } from "@/lib/aniversariantes"
import { sendPushToResponsavel } from "@/lib/push"

export async function runEnviarLembretesWhatsAppInadimplencia() {
  const config = getConfig()
  const intervaloMs = (config.intervaloDiasLembreteInadimplencia ?? 7) * 24 * 60 * 60 * 1000
  let enviados = 0
  let pulados = 0
  let semTelefone = 0
  let erros = 0

  const atrasadas = await db.pagamento.findMany({
    where: {
      dataPagamento: null,
      dataVencimento: { lt: new Date() },
    },
    include: {
      aluno: { select: { id: true, nome: true, telefone: true, responsavel: true, mensalidade: true } },
    },
  })

  // Agrupa por alunoId para consolidar múltiplos meses em 1 mensagem
  const porAluno = new Map<number, typeof atrasadas>()
  for (const p of atrasadas) {
    const lista = porAluno.get(p.aluno.id) ?? []
    lista.push(p)
    porAluno.set(p.aluno.id, lista)
  }

  for (const [alunoId, pagamentos] of porAluno) {
    const aluno = pagamentos[0].aluno
    const tel = aluno.telefone?.replace(/\D/g, "")
    if (!tel || tel.length < 8) { semTelefone++; continue }

    // Dedup: verifica último envio para este aluno
    const ultimoEnvio = await db.whatsAppMensagem.findFirst({
      where: { alunoId, origem: "lembrete-inadimplencia" },
      orderBy: { createdAt: "desc" },
    })
    if (ultimoEnvio && Date.now() - new Date(ultimoEnvio.createdAt).getTime() < intervaloMs) {
      pulados++
      continue
    }

    const nome = aluno.responsavel?.split(" ")[0] ?? "responsável"
    const linhasMeses = pagamentos.map((p) => `• ${p.mesReferencia} — ${formatMoney(aluno.mensalidade)}`).join("\n")
    const total = formatMoney(pagamentos.length * aluno.mensalidade)
    const pixLine = config.chavePix ? `\nPIX: ${config.chavePix}` : ""

    const msg = (config.templateCobranca || "Olá {responsavel}!\n\nLembrete: mensalidades de *{aluno}* em atraso:\n\n{meses}\n\nTotal: *{total}*\n{pix}\n\nQualquer dúvida, entre em contato.")
      .replace("{responsavel}", nome)
      .replace("{aluno}", aluno.nome)
      .replace("{meses}", linhasMeses)
      .replace("{total}", total)
      .replace("{pix}", pixLine)

    try {
      await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
      await db.whatsAppMensagem.create({
        data: {
          alunoId,
          telefone: tel,
          mensagem: msg,
          origem: "lembrete-inadimplencia",
          direcao: "outgoing",
          status: "sent",
          instancia: "escolinha",
        },
      })
      enviados++
    } catch {
      erros++
    }
  }

  return { enviados, pulados, erros, semTelefone }
}

export async function runEnviarLembretesWhatsAppVencendo() {
  const config = getConfig()
  let enviados = 0
  let pulados = 0
  let erros = 0
  let semTelefone = 0

  // Janela de dedup: o cron roda diário e a janela de vencimento é de 3 dias;
  // sem isso o mesmo vencimento dispararia um lembrete por dia. 4 dias garante
  // 1 lembrete por vencimento e libera o do próximo mês.
  const DEDUP_MS = 4 * 24 * 60 * 60 * 1000

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

    // Dedup: já avisamos este aluno sobre vencimento recentemente?
    const ultimoEnvio = await db.whatsAppMensagem.findFirst({
      where: { alunoId: p.aluno.id, origem: "lembrete-vencimento" },
      orderBy: { createdAt: "desc" },
    })
    if (ultimoEnvio && Date.now() - new Date(ultimoEnvio.createdAt).getTime() < DEDUP_MS) {
      pulados++
      continue
    }

    const dataVenc = new Date(p.dataVencimento).toLocaleDateString("pt-BR")
    const pixLine = config.chavePix ? `\nPIX: ${config.chavePix}` : ""
    const nome = p.aluno.responsavel?.split(" ")[0] ?? "responsável"

    const msg = (config.templateLembreteVencimento || "Olá {responsavel}! Lembrete: a mensalidade de *{aluno}* vence em *{data}*.\n\nValor: *{valor}*{pix}\n\nObrigado!")
      .replace("{responsavel}", nome)
      .replace("{aluno}", p.aluno.nome)
      .replace("{data}", dataVenc)
      .replace("{valor}", formatMoney(p.aluno.mensalidade))
      .replace("{pix}", pixLine)

    try {
      await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
      await db.whatsAppMensagem.create({
        data: {
          alunoId: p.aluno.id,
          telefone: tel,
          mensagem: msg,
          origem: "lembrete-vencimento",
          direcao: "outgoing",
          status: "sent",
          instancia: "escolinha",
        },
      })
      enviados++
    } catch {
      erros++
    }
  }

  return { enviados, pulados, erros, semTelefone }
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
    `Valor: *${formatMoney(p.valorRecebido ?? p.aluno.mensalidade)}*`,
    `Obrigado!`,
  ].join("\n")

  await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
}

export async function runEnviarParabensAniversariantes() {
  let enviados = 0
  let erros = 0

  const hoje = new Date()
  const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

  const ativos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: { id: true, nome: true, dataNascimento: true, telefone: true, responsavel: true },
  })
  const aniversariantes = ativos.filter((a) => ehAniversarioNoDia(a.dataNascimento, hoje))

  for (const a of aniversariantes) {
    const tel = a.telefone?.replace(/\D/g, "")
    if (!tel || tel.length < 8) continue

    // dedup: já parabenizamos este aluno hoje?
    const jaEnviado = await db.whatsAppMensagem.findFirst({
      where: { alunoId: a.id, origem: "aniversario", createdAt: { gte: inicioDoDia } },
      select: { id: true },
    })
    if (jaEnviado) continue

    const idade = hoje.getFullYear() - a.dataNascimento.getFullYear()
    const msg = [
      `🎉 Feliz aniversário, *${a.nome}*!`,
      ``,
      `Toda a Escolinha Itaquerense deseja um dia incrível e muita alegria nos seus ${idade} anos! ⚽🎂`,
    ].join("\n")

    try {
      await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
      await db.whatsAppMensagem.create({
        data: { alunoId: a.id, telefone: tel, mensagem: msg, origem: "aniversario" },
      })
      enviados++
    } catch {
      erros++
    }
  }

  return { aniversariantes: aniversariantes.length, enviados, erros }
}

export async function notificarFaltas(
  registros: { alunoId: number; data: string; presenca: string }[]
): Promise<{ enviados: number; erros: number }> {
  const config = getConfig()
  let enviados = 0
  let erros = 0

  const ausentes = registros.filter(
    (r) => r.presenca === "Ausente" || r.presenca === "Justificado"
  )
  if (ausentes.length === 0) return { enviados, erros }

  const hoje = new Date()
  const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

  const alunoIds = ausentes.map((r) => r.alunoId)

  // Batch: 1 query para alunos + 1 query para dedup (elimina 2N queries no loop)
  const [alunosRows, jaNotificadosRows] = await Promise.all([
    db.aluno.findMany({
      where: { id: { in: alunoIds } },
      select: { id: true, nome: true, telefone: true, responsavelId: true, responsavel: true },
    }),
    db.whatsAppMensagem.findMany({
      where: { alunoId: { in: alunoIds }, origem: "falta", createdAt: { gte: inicioDoDia } },
      select: { alunoId: true },
    }),
  ])

  const alunoMap = new Map(alunosRows.map((a) => [a.id, a]))
  const jaNotificadoSet = new Set(jaNotificadosRows.map((m) => m.alunoId))

  for (const r of ausentes) {
    try {
      const aluno = alunoMap.get(r.alunoId)
      if (!aluno) continue
      const tel = aluno.telefone?.replace(/\D/g, "")
      if (!tel || tel.length < 8) continue

      // dedup: já notificamos este aluno hoje?
      if (jaNotificadoSet.has(r.alunoId)) continue

      const dataLabel = new Date(r.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })
      const nomeResp = aluno.responsavel?.split(" ")[0] ?? "responsável"
      const msg = montarMensagemFalta(aluno.nome, dataLabel, r.presenca as "Ausente" | "Justificado", nomeResp, config.templateFalta || undefined)

      const registro = await db.whatsAppMensagem.create({
        data: { alunoId: r.alunoId, telefone: tel, mensagem: msg, origem: "falta" },
      })
      try {
        await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
      } catch (e) {
        await db.whatsAppMensagem.delete({ where: { id: registro.id } }).catch(() => {})
        throw e
      }
      // Push best-effort para responsável com dispositivo registrado
      if (aluno.responsavelId) {
        const dataLabel = new Date(r.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })
        sendPushToResponsavel(aluno.responsavelId, "falta", {
          title: r.presenca === "Justificado" ? `Falta justificada — ${aluno.nome}` : `${aluno.nome} faltou hoje`,
          body: `Ausência registrada no treino do dia ${dataLabel}.`,
          url: "/responsavel/frequencia",
        }).catch(() => null)
      }
      enviados++
    } catch {
      erros++
    }
  }

  return { enviados, erros }
}

export function montarMensagemFalta(
  nome: string,
  dataLabel: string,
  presenca: "Ausente" | "Justificado",
  responsavel?: string,
  templateFalta?: string
): string {
  if (templateFalta) {
    return templateFalta
      .replace("{responsavel}", responsavel ?? "responsável")
      .replace("{aluno}", nome)
      .replace("{data}", dataLabel)
  }
  if (presenca === "Justificado") {
    return [
      `📋 Olá! Registramos a *ausência justificada* de *${nome}* no treino do dia ${dataLabel}.`,
      ``,
      `— Escolinha Itaquerense`,
    ].join("\n")
  }
  return [
    `⚠️ Olá! Registramos a *falta* de *${nome}* no treino do dia ${dataLabel}.`,
    ``,
    `Qualquer dúvida, estamos à disposição. — Escolinha Itaquerense`,
  ].join("\n")
}
