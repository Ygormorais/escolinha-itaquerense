"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { db } from "@/lib/db"

const idSchema = z.number().int().positive()
const statusSelect = { id: true, responsavelId: true, publicadoEm: true, retiradoEm: true, lidoEm: true } as const
function serializar(p: { id: number; responsavelId: number; publicadoEm: Date; retiradoEm: Date | null; lidoEm: Date | null }) {
  return { ...p, publicadoEm: p.publicadoEm.toISOString(), retiradoEm: p.retiradoEm?.toISOString() ?? null, lidoEm: p.lidoEm?.toISOString() ?? null }
}

export async function consultarPublicacaoResumo(resumoId: number) {
  await requireAuth(["admin", "tecnico"])
  if (!idSchema.safeParse(resumoId).success) return { error: "Resumo inválido." }
  const r = await db.resumoFamiliar.findUnique({ where: { id: resumoId }, select: {
    id: true, aluno: { select: { nome: true, status: true, responsavelRef: { select: { id: true, nome: true, ativo: true } } } },
    publicacao: { select: statusSelect },
  } })
  if (!r) return { error: "Resumo não encontrado." }
  const responsavel = r.aluno.status === "Ativo" && r.aluno.responsavelRef?.ativo ? { id: r.aluno.responsavelRef.id, nome: r.aluno.responsavelRef.nome } : null
  return { dados: { alunoNome: r.aluno.nome, responsavel, publicacao: r.publicacao ? serializar(r.publicacao) : null } }
}

export async function publicarResumoFamiliar(input: { resumoId: number; responsavelId: number; revisado: boolean }) {
  const auth = await requireAuth(["admin", "tecnico"])
  const p = z.object({ resumoId: idSchema, responsavelId: idSchema, revisado: z.literal(true) }).safeParse(input)
  if (!p.success) return { error: "Confira o texto salvo e o destinatário antes de publicar." }
  const result = await db.$transaction(async (tx) => {
    // O vínculo é relido dentro da transação; o ID informado só confirma o destinatário mostrado na tela.
    const r = await tx.resumoFamiliar.findFirst({ where: { id: p.data.resumoId, aluno: { status: "Ativo", responsavelId: p.data.responsavelId, responsavelRef: { ativo: true } } }, select: { id: true, publicacao: { select: statusSelect } } })
    if (!r) return { error: "O atleta ou responsável não está disponível, ou o vínculo mudou. Consulte a publicação novamente." }
    if (r.publicacao) {
      if (r.publicacao.responsavelId !== p.data.responsavelId) return { error: "Esta versão pertence a outro destinatário. Prepare uma nova versão revisada para o vínculo atual." }
      if (r.publicacao.retiradoEm) return { error: "Esta publicação foi retirada. Prepare uma nova versão revisada antes de publicar novamente." }
      return { publicacao: serializar(r.publicacao) }
    }
    const publicada = await tx.publicacaoResumo.create({ data: { resumoId: r.id, responsavelId: p.data.responsavelId, publicadoPor: auth.user }, select: statusSelect })
    return { publicacao: serializar(publicada) }
  })
  revalidatePath("/responsavel/desempenho")
  return result
}

export async function retirarPublicacaoResumo(publicacaoId: number) {
  await requireAuth(["admin", "tecnico"])
  if (!idSchema.safeParse(publicacaoId).success) return { error: "Publicação inválida." }
  // Retirar não apaga a versão nem a confirmação de leitura que já ocorreu.
  await db.publicacaoResumo.updateMany({ where: { id: publicacaoId, retiradoEm: null }, data: { retiradoEm: new Date() } })
  revalidatePath("/responsavel/desempenho")
  return { success: true }
}

function escopoFamilia(responsavelId: number) {
  return { responsavelId, retiradoEm: null, responsavel: { ativo: true }, resumo: { aluno: { responsavelId, status: "Ativo" } } } as const
}

export async function listarResumosPublicados(antesDe?: number) {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return { error: "Sessão expirada. Entre novamente no portal." }
  if (antesDe !== undefined && !idSchema.safeParse(antesDe).success) return { error: "Página inválida." }
  const rows = await db.publicacaoResumo.findMany({ where: { ...escopoFamilia(session.responsavelId), ...(antesDe ? { id: { lt: antesDe } } : {}) }, select: {
    id: true, publicadoEm: true, lidoEm: true,
    resumo: { select: { mes: true, texto: true, aluno: { select: { nome: true } } } },
  }, orderBy: { id: "desc" }, take: 11 })
  return { itens: rows.slice(0, 10).map((r) => ({ id: r.id, publicadoEm: r.publicadoEm.toISOString(), lidoEm: r.lidoEm?.toISOString() ?? null, mes: r.resumo.mes, texto: r.resumo.texto, alunoNome: r.resumo.aluno.nome })), proximaPagina: rows.length > 10 ? rows[9].id : null }
}

export async function confirmarLeituraResumo(publicacaoId: number) {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return { error: "Sessão expirada. Entre novamente no portal." }
  if (!idSchema.safeParse(publicacaoId).success) return { error: "Publicação inválida." }
  const where = { id: publicacaoId, ...escopoFamilia(session.responsavelId) }
  // A autorização faz parte do UPDATE: não é possível confirmar em nome de outra família.
  await db.publicacaoResumo.updateMany({ where: { ...where, lidoEm: null }, data: { lidoEm: new Date() } })
  const row = await db.publicacaoResumo.findFirst({ where, select: { lidoEm: true } })
  if (!row?.lidoEm) return { error: "Resumo indisponível. Ele pode ter sido retirado ou o vínculo do atleta mudou." }
  return { lidoEm: row.lidoEm.toISOString() }
}
