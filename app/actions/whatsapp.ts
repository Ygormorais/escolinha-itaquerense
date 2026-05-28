"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getWhatsAppProvider } from "@/lib/whatsapp/provider"
import { getConfig } from "@/lib/config"
import { requireAuth } from "@/lib/auth"

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
    const mensagem = `*${config.nome}* - Lembrete de Mensalidade\n\nOlá, *${aluno.responsavel || aluno.nome}*!\n\nA mensalidade do *${aluno.nome}* referente a *${mesReferencia}* está disponível para pagamento.\n\nValor: R$ ${valor.toFixed(2)}${config.chavePix ? `\n\nPIX: ${config.chavePix}` : ""}\n\nQualquer dúvida, estamos à disposição.`

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

    revalidatePath("/comunicados")
    return { enviados, erros, semTelefone }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar comunicado" }
  }
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
