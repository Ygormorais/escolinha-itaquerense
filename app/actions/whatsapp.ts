"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"
import { getConfig } from "@/lib/config"
import { requireAuth } from "@/lib/auth"
import { formatMoney } from "@/lib/utils"
import { sendPushToResponsavel } from "@/lib/push"

type ActionResult = { success: true } | { error: string }

export async function enviarWhatsApp(
  alunoId: number,
  telefone: string,
  mensagem: string
): Promise<ActionResult> {
  await requireAuth()
  try {
    const provider = getWhatsAppProvider()
    const result = await provider.sendText({ telefone, mensagem })

    await db.whatsAppMensagem.create({
      data: {
        alunoId,
        telefone,
        mensagem,
        tipo: "text",
        direcao: "outgoing",
        status: result.success ? "sent" : "failed",
        origem: "manual",
        messageId: result.messageId ?? null,
      },
    })

    revalidatePath(`/alunos/${alunoId}`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar WhatsApp" }
  }
}

export async function enviarCobrancaWhatsApp(
  alunoId: number,
  telefone: string,
  mesReferencia: string,
  valor: number
): Promise<ActionResult> {
  await requireAuth()
  try {
    const aluno = await db.aluno.findUnique({
      where: { id: alunoId },
      select: { nome: true, responsavel: true },
    })

    if (!aluno) return { error: "Aluno não encontrado" }

    const config = getConfig()
    const mensagem = `*${config.nome}* - Lembrete de Mensalidade\n\nOlá, *${aluno.responsavel || aluno.nome}*!\n\nA mensalidade do *${aluno.nome}* referente a *${mesReferencia}* está disponível para pagamento.\n\nValor: *${formatMoney(valor)}*${config.chavePix ? `\n\nPIX: ${config.chavePix}` : ""}\n\nQualquer dúvida, estamos à disposição.`

    const provider = getWhatsAppProvider()
    const result = await provider.sendText({ telefone, mensagem })

    await db.whatsAppMensagem.create({
      data: {
        alunoId,
        telefone,
        mensagem,
        tipo: "text",
        direcao: "outgoing",
        status: result.success ? "sent" : "failed",
        origem: "cobranca",
        messageId: result.messageId ?? null,
      },
    })

    revalidatePath("/inadimplencia")
    revalidatePath(`/alunos/${alunoId}`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar cobrança" }
  }
}

export async function enviarComunicadoMassa(
  mensagem: string,
  turma: string
): Promise<{ enviados: number; erros: number; semTelefone: number } | { error: string }> {
  await requireAuth()
  try {
    const where = turma === "Todas" ? {} : { turma }
    const alunos = await db.aluno.findMany({
      where: { ...where, status: "Ativo" },
      select: { id: true, nome: true, telefone: true },
    })

    let enviados = 0
    let erros = 0
    let semTelefone = 0

    const provider = getWhatsAppProvider()

    for (const aluno of alunos) {
      const telefone = aluno.telefone?.replace(/\D/g, "")
      if (!telefone || telefone.length < 10) {
        semTelefone++
        continue
      }

      try {
        const msgPersonalizada = mensagem.replace(/\{nome\}/g, aluno.nome)
        const result = await provider.sendText({ telefone, mensagem: msgPersonalizada })
        enviados++

        await db.whatsAppMensagem.create({
          data: {
            alunoId: aluno.id,
            telefone,
            mensagem: msgPersonalizada,
            tipo: "text",
            direcao: "outgoing",
            status: result.success ? "sent" : "failed",
            origem: "comunicado",
            messageId: result.messageId ?? null,
          },
        })
      } catch {
        erros++
      }
    }

    // Push para responsáveis com dispositivo registrado
    const responsaveisIds = await db.aluno.findMany({
      where: turma === "Todas" ? { status: "Ativo" } : { turma, status: "Ativo" },
      select: { responsavelId: true },
    }).then((rows) => [...new Set(rows.map((r) => r.responsavelId).filter((id): id is number => id != null))])

    const preview = mensagem.slice(0, 80) + (mensagem.length > 80 ? "…" : "")
    await Promise.allSettled(
      responsaveisIds.map((id) =>
        sendPushToResponsavel(id, "comunicado", {
          title: "Novo comunicado da escolinha",
          body: preview,
          url: "/responsavel/notificacoes",
        })
      )
    )

    revalidatePath("/comunicados")
    return { enviados, erros, semTelefone }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar comunicado" }
  }
}

/** Registra no histórico um comunicado aberto via WhatsApp (wa.me).
 *  O envio em si acontece no app do WhatsApp (o usuário escolhe o grupo/lista). */
export async function registrarComunicadoWhatsApp(
  mensagem: string
): Promise<{ ok: true } | { error: string }> {
  await requireAuth()
  const texto = mensagem.trim()
  if (!texto) return { error: "Mensagem vazia" }
  await db.whatsAppMensagem.create({
    data: {
      telefone: "grupo",
      mensagem: texto,
      tipo: "text",
      direcao: "outgoing",
      status: "sent",
      origem: "comunicado",
    },
  })
  revalidatePath("/comunicados")
  return { ok: true }
}

export async function getHistoricoWhatsApp(alunoId: number) {
  return db.whatsAppMensagem.findMany({
    where: { alunoId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}

export async function getMensagensNaoLidas() {
  return db.whatsAppMensagem.count({
    where: { direcao: "incoming", lida: false },
  })
}

export async function marcarMensagemLida(id: number) {
  await requireAuth()
  await db.whatsAppMensagem.update({
    where: { id },
    data: { lida: true },
  })
}

export async function enviarWhatsAppResponsavel(
  responsavelId: number,
  mensagem: string
): Promise<ActionResult> {
  await requireAuth()
  try {
    const responsavel = await db.responsavel.findUnique({ where: { id: responsavelId } })
    if (!responsavel) return { error: "Responsável não encontrado" }

    const telefone = responsavel.telefone?.replace(/\D/g, "")
    if (!telefone || telefone.length < 10) return { error: "Telefone inválido" }

    const provider = getWhatsAppProvider()
    const result = await provider.sendText({ telefone, mensagem })

    await db.whatsAppMensagem.create({
      data: {
        telefone,
        mensagem,
        tipo: "text",
        direcao: "outgoing",
        status: result.success ? "sent" : "failed",
        origem: "manual",
        messageId: result.messageId ?? null,
      },
    })

    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar WhatsApp" }
  }
}

export async function notificarInadimplentesEmLote(
  alunoIds: number[]
): Promise<{ enviados: number; erros: number; semTelefone: number }> {
  await requireAuth()
  const config = getConfig()
  let enviados = 0
  let erros = 0
  let semTelefone = 0

  const alunos = await db.aluno.findMany({
    where: { id: { in: alunoIds }, status: "Ativo" },
    select: {
      id: true,
      nome: true,
      telefone: true,
      mensalidade: true,
      pagamentos: {
        where: { dataPagamento: null, dataVencimento: { lt: new Date() } },
        select: { mesReferencia: true },
      },
    },
  })

  const provider = getWhatsAppProvider()

  for (const aluno of alunos) {
    const tel = aluno.telefone?.replace(/\D/g, "")
    if (!tel || tel.length < 10) { semTelefone++; continue }
    if (aluno.pagamentos.length === 0) continue

    const meses = aluno.pagamentos.map((p) => `• ${p.mesReferencia}`).join("\n")
    const total = formatMoney(aluno.mensalidade * aluno.pagamentos.length)
    const msg = [
      `Olá ${aluno.nome.split(" ")[0]}! 👋`,
      ``,
      `Identificamos ${aluno.pagamentos.length} ${aluno.pagamentos.length === 1 ? "mensalidade em aberto" : "mensalidades em aberto"} na ${config.nome}:`,
      ``,
      meses,
      ``,
      `Total: *${total}*`,
      config.chavePix ? `PIX: ${config.chavePix}` : ``,
      ``,
      `Entre em contato para regularizar. Obrigado!`,
    ].filter(Boolean).join("\n")

    try {
      await provider.sendText({ telefone: tel, mensagem: msg })
      await db.whatsAppMensagem.create({
        data: {
          alunoId: aluno.id,
          telefone: tel,
          mensagem: msg,
          tipo: "text",
          direcao: "outgoing",
          status: "sent",
          origem: "cobranca",
        },
      })
      enviados++
    } catch {
      erros++
    }
  }

  revalidatePath("/inadimplencia")
  return { enviados, erros, semTelefone }
}

export async function enviarComunicadoResponsaveis(mensagem: string): Promise<{
  enviados: number
  erros: number
  semTelefone: number
} | { error: string }> {
  await requireAuth()
  try {
    const responsaveis = await db.responsavel.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, telefone: true },
    })

    let enviados = 0
    let erros = 0
    let semTelefone = 0

    const provider = getWhatsAppProvider()

    for (const r of responsaveis) {
      const telefone = r.telefone?.replace(/\D/g, "")
      if (!telefone || telefone.length < 10) {
        semTelefone++
        continue
      }

      try {
        const msgPersonalizada = mensagem.replace(/\{nome\}/g, r.nome)
        const result = await provider.sendText({ telefone, mensagem: msgPersonalizada })
        enviados++

        await db.whatsAppMensagem.create({
          data: {
            telefone,
            mensagem: msgPersonalizada,
            tipo: "text",
            direcao: "outgoing",
            status: result.success ? "sent" : "failed",
            origem: "comunicado",
            messageId: result.messageId ?? null,
          },
        })
      } catch {
        erros++
      }
    }

    return { enviados, erros, semTelefone }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar comunicado" }
  }
}
