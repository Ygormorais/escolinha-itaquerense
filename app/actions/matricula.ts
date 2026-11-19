"use server"

import { revalidatePath } from "next/cache"
import { addMonths, format } from "date-fns"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "./log"
import { deleteMatriculaDocuments } from "@/lib/matricula-files"
import { valorDevidoDoAluno } from "@/lib/valor-devido"
import { diaVencimentoConfigurado } from "@/lib/pagamentos-jobs"
import { checkRateLimit } from "@/lib/rate-limit"
import { TURMAS } from "@/lib/constants"
import { headers } from "next/headers"
import { z } from "zod"
import { getClientIpFromHeaders } from "@/lib/client-ip"
import {
  primeiroCampoComErro,
  validarPreMatricula,
  type ErrosPreMatricula,
} from "@/lib/site/matricula-validacao"

export type ActionResult = { success: true } | { error: string }
/** Resultado da pré-matrícula pública; `campos` traz a mensagem de cada campo inválido. */
export type PreMatriculaResult = { success: true } | { error: string; campos?: ErrosPreMatricula }
export type AprovarResult = { success: true; alunoId: number } | { error: string }
const CONSENTIMENTO_VERSAO = "2026-08-11"

/** Formulário preenchido em menos que isso é robô. Em dev/e2e fica zerado para não travar a suíte. */
function tempoMinimoPreenchimentoMs(): number {
  const configurado = Number(process.env.MATRICULA_TEMPO_MINIMO_MS)
  if (Number.isFinite(configurado) && process.env.MATRICULA_TEMPO_MINIMO_MS !== undefined) return configurado
  return process.env.NODE_ENV === "production" ? 3000 : 0
}

// Endpoint público: limita tamanho de cada campo e aceita só turmas cadastradas.
const preMatriculaSchema = z.object({
  nomeAluno: z.string().trim().min(1).max(120),
  dataNascimento: z.string().max(10),
  turma: z.enum(TURMAS),
  horario: z.string().trim().max(60),
  nomeResponsavel: z.string().trim().min(1).max(120),
  telefone: z.string().trim().min(1).max(30),
  email: z.union([z.literal(""), z.string().trim().max(254).email()]),
  documentos: z.array(z.string().max(200)).max(10).optional(),
  observacoes: z.string().trim().max(2000).optional(),
  consentimento: z.literal(true),
})

export async function criarPreMatricula(data: {
  nomeAluno: string
  dataNascimento: string
  turma: string
  horario: string
  nomeResponsavel: string
  telefone: string
  email: string
  documentos?: string[]
  observacoes?: string
  consentimento: boolean
  /** Isca anti-robô: campo invisível; pessoa nunca preenche. */
  website?: string
  /** Momento (ms desde 1970) em que o formulário foi aberto. */
  abertoEm?: number
}): Promise<PreMatriculaResult> {
  // Limite por IP: 5 envios a cada 10 minutos. Usa o mesmo getClientIp do upload
  // (último valor do X-Forwarded-For, o que o proxy acrescentou e o cliente não forja).
  const ip = getClientIpFromHeaders(await headers())
  const limite = checkRateLimit(`pre-matricula:${ip}`, 5, 10 * 60_000)
  if (!limite.ok) return { error: "Muitos envios. Aguarde alguns minutos e tente de novo." }

  // Robô: isca preenchida ou formulário enviado rápido demais. Responde sucesso para
  // não dar pista, mas não grava nada.
  const rapidoDemais =
    typeof data?.abertoEm === "number" && Date.now() - data.abertoEm < tempoMinimoPreenchimentoMs()
  if ((typeof data?.website === "string" && data.website.trim() !== "") || rapidoDemais) {
    return { success: true }
  }

  // Mesma validação do formulário (lib/site/matricula-validacao).
  const erros = validarPreMatricula({
    nomeAluno: data?.nomeAluno ?? "",
    dataNascimento: data?.dataNascimento ?? "",
    turma: data?.turma ?? "",
    nomeResponsavel: data?.nomeResponsavel ?? "",
    telefone: data?.telefone ?? "",
    email: data?.email ?? "",
    consentimento: data?.consentimento === true,
  })
  const primeiro = primeiroCampoComErro(erros)
  if (primeiro) {
    const quantidade = Object.keys(erros).length
    return {
      error: quantidade === 1 ? erros[primeiro]! : "Confira os campos destacados no formulário.",
      campos: erros,
    }
  }

  const parsed = preMatriculaSchema.safeParse({ ...data, email: data.email?.trim() ?? "" })
  if (!parsed.success) return { error: "Dados inválidos. Confira turma, e-mail e o tamanho dos textos." }
  const dataNasc = new Date(data.dataNascimento)

  // Endpoint público: só aceita caminhos de upload internos (vindos de
  // /api/upload/matricula). Descarta URLs arbitrárias/javascript: que o admin
  // clicaria no painel (phishing/XSS via href).
  const UPLOAD_RE = /^\/uploads\/matriculas\/[A-Za-z0-9._-]+$/
  const docsValidos = (data.documentos ?? []).filter(
    (d) => typeof d === "string" && UPLOAD_RE.test(d)
  )

  try {
    await db.preMatricula.create({
      data: {
        nomeAluno: data.nomeAluno.trim(),
        dataNascimento: dataNasc,
        turma: data.turma,
        horario: data.horario,
        nomeResponsavel: data.nomeResponsavel.trim(),
        telefone: data.telefone.trim(),
        email: data.email.trim(),
        documentos: docsValidos.length > 0 ? JSON.stringify(docsValidos) : null,
        observacoes: data.observacoes?.trim() || null,
        status: "pendente",
        consentimentoEm: new Date(),
        consentimentoVersao: CONSENTIMENTO_VERSAO,
      },
    })
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao enviar pré-matrícula" }
  }
}

export async function listarPreMatriculas(status?: string) {
  await requireAuth(["admin", "secretaria"])
  const where = status && status !== "todas" ? { status } : {}
  return db.preMatricula.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
}

class JaAprovada extends Error {}

export async function aprovarPreMatricula(
  id: number,
  opts: { mensalidade: number; desconto?: number; meses?: number }
): Promise<AprovarResult> {
  await requireAuth(["admin", "secretaria"])

  const mensalidade = Number(opts?.mensalidade)
  if (!Number.isFinite(mensalidade) || mensalidade < 0) {
    return { error: "Informe uma mensalidade válida" }
  }
  const descontoRaw = Number(opts?.desconto)
  const desconto = Number.isFinite(descontoRaw) && descontoRaw > 0 ? descontoRaw : 0

  const pre = await db.preMatricula.findUnique({ where: { id } })
  if (!pre) return { error: "Pré-matrícula não encontrada" }
  if (pre.status === "aprovada") return { error: "Pré-matrícula já aprovada" }

  try {
    const aluno = await db.$transaction(async (tx) => {
      // Trava atômica: duas aprovações simultâneas passam pela checagem acima, mas só uma
      // consegue virar a pré-matrícula para "aprovada"; a outra aborta sem criar aluno.
      const { count } = await tx.preMatricula.updateMany({
        where: { id, status: { not: "aprovada" } },
        data: { status: "aprovada", decididoEm: new Date() },
      })
      if (count === 0) throw new JaAprovada()
      let responsavelId: number | null = null
      if (pre.email?.trim()) {
        const resp = await tx.responsavel.findFirst({ where: { email: pre.email.trim() } })
        if (resp) responsavelId = resp.id
      }
      const novo = await tx.aluno.create({
        data: {
          nome: pre.nomeAluno,
          dataNascimento: pre.dataNascimento,
          turma: pre.turma,
          horario: pre.horario,
          responsavel: pre.nomeResponsavel,
          telefone: pre.telefone,
          email: pre.email,
          dataMatricula: new Date(),
          mensalidade,
          desconto,
          status: "Ativo",
          observacoes: pre.observacoes,
          responsavelId,
        },
      })
      const diaVencimento = diaVencimentoConfigurado()
      const qtdMeses = Math.max(0, Math.min(12, Number(opts.meses ?? 0)))
      for (let i = 0; i < qtdMeses; i++) {
        const dataRef = addMonths(new Date(), i)
        const vencimento = new Date(dataRef.getFullYear(), dataRef.getMonth(), diaVencimento)
        await tx.pagamento.create({
          data: {
            alunoId: novo.id,
            mesReferencia: format(dataRef, "yyyy-MM"),
            dataVencimento: vencimento,
            valorDevido: valorDevidoDoAluno({ mensalidade, desconto }),
          },
        })
      }
      return novo
    })

    await registrarLog("matricula", "Pré-matrícula aprovada → aluno criado", {
      preMatriculaId: id,
      alunoId: aluno.id,
    })
    revalidatePath("/configuracoes/matriculas")
    revalidatePath("/pagamentos")
    return { success: true, alunoId: aluno.id }
  } catch (e) {
    if (e instanceof JaAprovada) return { error: "Pré-matrícula já aprovada" }
    return { error: e instanceof Error ? e.message : "Erro ao aprovar pré-matrícula" }
  }
}

export async function recusarPreMatricula(id: number) {
  await requireAuth(["admin", "secretaria"])
  await db.preMatricula.update({ where: { id }, data: { status: "recusada", decididoEm: new Date() } })
  revalidatePath("/configuracoes/matriculas")
  return { success: true }
}

export async function deletarPreMatricula(id: number): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  const pre = await db.preMatricula.findUnique({ where: { id }, select: { documentos: true } })
  if (!pre) return { error: "Pré-matrícula não encontrada" }
  try {
    await deleteMatriculaDocuments(pre.documentos)
    await db.preMatricula.delete({ where: { id } })
    revalidatePath("/configuracoes/matriculas")
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erro ao excluir a pré-matrícula" }
  }
}
