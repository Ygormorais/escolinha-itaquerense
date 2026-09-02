"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

const versaoSchema = z.object({
  versao: z.string().trim().min(1).max(40),
  conteudo: z.string().trim().min(20).max(12000),
  url: z.string().trim().max(1000).optional(),
  turmas: z.string().trim().min(1).max(500),
  obrigatorio: z.boolean(),
})

function urlValida(url: string) {
  if (!url) return true
  if (url.startsWith("/")) return !url.startsWith("//")
  try { return new URL(url).protocol === "https:" } catch { return false }
}

export async function criarDocumento(input: {
  titulo: string
  categoria: string
  versao: string
  conteudo: string
  url?: string
  turmas: string
  obrigatorio: boolean
}) {
  const session = await requireAuth(["admin", "secretaria"])
  const base = z.object({ titulo: z.string().trim().min(3).max(160), categoria: z.string().trim().min(2).max(80) }).safeParse(input)
  const versao = versaoSchema.safeParse(input)
  if (!base.success || !versao.success) return { error: "Preencha os dados e o conteúdo da versão." }
  if (!urlValida(versao.data.url ?? "")) return { error: "Use um endereço HTTPS ou um caminho interno válido." }
  try {
    await db.documentoInstitucional.create({
      data: {
        titulo: base.data.titulo,
        categoria: base.data.categoria,
        criadoPor: session.user,
        versoes: { create: { ...versao.data, url: versao.data.url || null, criadoPor: session.user } },
      },
    })
  } catch {
    return { error: "Não foi possível criar o documento." }
  }
  revalidatePath("/configuracoes/documentos")
  revalidatePath("/responsavel/documentos")
  return { success: true as const }
}

export async function publicarVersao(documentoId: number, input: { versao: string; conteudo: string; url?: string; turmas: string; obrigatorio: boolean }) {
  const session = await requireAuth(["admin", "secretaria"])
  const parsed = versaoSchema.safeParse(input)
  if (!Number.isInteger(documentoId) || !parsed.success) return { error: "Versão inválida." }
  if (!urlValida(parsed.data.url ?? "")) return { error: "Use um endereço HTTPS ou um caminho interno válido." }
  const documento = await db.documentoInstitucional.findUnique({ where: { id: documentoId }, select: { id: true } })
  if (!documento) return { error: "Documento não encontrado." }
  try {
    await db.documentoVersao.create({ data: { documentoId, ...parsed.data, url: parsed.data.url || null, criadoPor: session.user } })
  } catch {
    return { error: "Esta versão já existe ou não pôde ser publicada." }
  }
  revalidatePath("/configuracoes/documentos")
  revalidatePath("/responsavel/documentos")
  return { success: true as const }
}

export async function definirDocumentoAtivo(id: number, ativo: boolean) {
  await requireAuth(["admin", "secretaria"])
  if (!Number.isInteger(id)) return { error: "Documento inválido." }
  const resultado = await db.documentoInstitucional.updateMany({ where: { id }, data: { ativo } })
  if (resultado.count === 0) return { error: "Documento não encontrado." }
  revalidatePath("/configuracoes/documentos")
  revalidatePath("/responsavel/documentos")
  return { success: true as const }
}

export async function aceitarDocumento(versaoId: number, alunoId: number, confirmado: boolean) {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) return { error: "Sessão expirada. Entre novamente." }
  if (!confirmado) return { error: "Confirme a leitura e o aceite para continuar." }
  const aluno = await db.aluno.findFirst({ where: { id: alunoId, responsavelId: session.responsavelId, status: "Ativo" }, select: { id: true, turma: true } })
  if (!aluno) return { error: "Aluno não encontrado para esta família." }
  const versao = await db.documentoVersao.findFirst({ where: { id: versaoId, documento: { ativo: true } }, select: { id: true, turmas: true, documento: { select: { titulo: true } } } })
  if (!versao) return { error: "Documento indisponível." }
  const turmas = versao.turmas.split(",").map((item) => item.trim())
  if (!turmas.includes("Todas") && !turmas.includes(aluno.turma)) return { error: "Este documento não se aplica à turma do aluno." }
  await db.documentoAceite.upsert({
    where: { versaoId_responsavelId_alunoId: { versaoId, responsavelId: session.responsavelId, alunoId } },
    update: { declaracao: `Leitura e aceite confirmados para ${versao.documento.titulo}.`, aceitoEm: new Date() },
    create: { versaoId, responsavelId: session.responsavelId, alunoId, declaracao: `Leitura e aceite confirmados para ${versao.documento.titulo}.` },
  })
  revalidatePath("/responsavel/documentos")
  revalidatePath("/configuracoes/documentos")
  return { success: true as const }
}
