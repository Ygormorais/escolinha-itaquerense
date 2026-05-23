"use server"

import { db } from "@/lib/db"
import { enviarEmail } from "@/lib/mailer"
import { getConfig } from "@/lib/config"
import { differenceInDays } from "date-fns"
import { requireAuth } from "@/lib/auth"

type ResultadoEmail = { enviados: number; erros: number; semEmail: number }

export async function enviarLembretesInadimplentes(): Promise<ResultadoEmail | { error: string }> {
  await requireAuth()
  try {
    const config = getConfig()

    const inadimplentes = await db.pagamento.findMany({
      where: { dataPagamento: null, dataVencimento: { lt: new Date() } },
      include: {
        aluno: {
          select: { nome: true, email: true, responsavel: true, mensalidade: true },
        },
      },
    })

    let enviados = 0
    let erros = 0
    let semEmail = 0

    for (const p of inadimplentes) {
      const email = p.aluno.email
      if (!email) { semEmail++; continue }

      const diasAtraso = differenceInDays(new Date(), p.dataVencimento)

      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#1a3c34;color:white;padding:24px 32px;border-radius:8px 8px 0 0">
            <h2 style="margin:0;font-size:18px">${config.nome}</h2>
            <p style="margin:4px 0 0;opacity:.7;font-size:13px">Aviso de mensalidade em atraso</p>
          </div>
          <div style="background:#f9fafb;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
            <p style="margin-top:0">Olá, <strong>${p.aluno.responsavel || p.aluno.nome}</strong>!</p>
            <p>Identificamos que a mensalidade de <strong>${p.aluno.nome}</strong> referente ao mês
            <strong>${p.mesReferencia}</strong> está em aberto há <strong>${diasAtraso} dia(s)</strong>.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
              <tr style="background:#f1f5f9">
                <td style="padding:8px 12px;border:1px solid #e2e8f0">Aluno</td>
                <td style="padding:8px 12px;border:1px solid #e2e8f0"><strong>${p.aluno.nome}</strong></td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border:1px solid #e2e8f0">Referência</td>
                <td style="padding:8px 12px;border:1px solid #e2e8f0">${p.mesReferencia}</td>
              </tr>
              <tr style="background:#f1f5f9">
                <td style="padding:8px 12px;border:1px solid #e2e8f0">Valor</td>
                <td style="padding:8px 12px;border:1px solid #e2e8f0"><strong>R$ ${p.aluno.mensalidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></td>
              </tr>
              <tr>
                <td style="padding:8px 12px;border:1px solid #e2e8f0">Dias em atraso</td>
                <td style="padding:8px 12px;border:1px solid #e2e8f0;color:#dc2626"><strong>${diasAtraso} dia(s)</strong></td>
              </tr>
            </table>
            ${config.chavePix ? `<p style="font-size:13px">Para pagamento via PIX, utilize a chave: <strong>${config.chavePix}</strong></p>` : ""}
            <p style="font-size:12px;color:#6b7280;margin-bottom:0">
              Em caso de dúvidas, entre em contato: ${config.telefone || config.nome}
            </p>
          </div>
        </div>
      `

      try {
        await enviarEmail(email, `[${config.nome}] Mensalidade em atraso — ${p.mesReferencia}`, html)
        enviados++
      } catch {
        erros++
      }
    }

    return { enviados, erros, semEmail }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar e-mails" }
  }
}

export async function enviarLembreteVencendo(): Promise<ResultadoEmail | { error: string }> {
  await requireAuth()
  try {
    const config = getConfig()
    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 3)

    const vencendo = await db.pagamento.findMany({
      where: {
        dataPagamento: null,
        dataVencimento: { gte: new Date(), lte: amanha },
      },
      include: {
        aluno: { select: { nome: true, email: true, responsavel: true, mensalidade: true } },
      },
    })

    let enviados = 0
    let erros = 0
    let semEmail = 0

    for (const p of vencendo) {
      const email = p.aluno.email
      if (!email) { semEmail++; continue }

      const html = `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <div style="background:#1a3c34;color:white;padding:24px 32px;border-radius:8px 8px 0 0">
            <h2 style="margin:0;font-size:18px">${config.nome}</h2>
            <p style="margin:4px 0 0;opacity:.7;font-size:13px">Lembrete de mensalidade</p>
          </div>
          <div style="background:#f9fafb;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
            <p style="margin-top:0">Olá, <strong>${p.aluno.responsavel || p.aluno.nome}</strong>!</p>
            <p>Lembramos que a mensalidade de <strong>${p.aluno.nome}</strong> referente a
            <strong>${p.mesReferencia}</strong> vence em
            <strong>${new Date(p.dataVencimento).toLocaleDateString("pt-BR")}</strong>.</p>
            <p>Valor: <strong>R$ ${p.aluno.mensalidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></p>
            ${config.chavePix ? `<p style="font-size:13px">PIX: <strong>${config.chavePix}</strong></p>` : ""}
            <p style="font-size:12px;color:#6b7280;margin-bottom:0">${config.telefone || config.nome}</p>
          </div>
        </div>
      `

      try {
        await enviarEmail(email, `[${config.nome}] Lembrete de mensalidade — ${p.mesReferencia}`, html)
        enviados++
      } catch {
        erros++
      }
    }

    return { enviados, erros, semEmail }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar lembretes" }
  }
}
