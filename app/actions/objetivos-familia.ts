"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

const criarSchema = z.object({
  alunoId: z.number().int().positive(),
  titulo: z.string().trim().min(3).max(120),
  descricao: z.string().trim().min(10).max(1200),
  prazo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
})

export async function listarObjetivosComissao() {
  await requireAuth(["admin", "tecnico"])
  const [alunos, objetivos] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo" }, select: { id: true, nome: true, turma: true }, orderBy: [{ turma: "asc" }, { nome: "asc" }] }),
    db.objetivoCompartilhado.findMany({
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 100,
    }),
  ])
  return { dados: { alunos, objetivos } }
}

export async function criarObjetivoCompartilhado(input: { alunoId: number; titulo: string; descricao: string; prazo?: string }) {
  const session = await requireAuth(["admin", "tecnico"])
  const parsed = criarSchema.safeParse(input)
  if (!parsed.success) return { error: "Preencha atleta, título e descrição do objetivo." }
  const aluno = await db.aluno.findFirst({ where: { id: parsed.data.alunoId, status: "Ativo" }, select: { id: true } })
  if (!aluno) return { error: "Atleta ativo não encontrado." }
  await db.objetivoCompartilhado.create({
    data: {
      alunoId: parsed.data.alunoId,
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao,
      prazo: parsed.data.prazo ? new Date(`${parsed.data.prazo}T12:00:00`) : null,
      criadoPor: session.user,
    },
  })
  revalidatePath("/desenvolvimento")
  revalidatePath("/responsavel/desempenho")
  return { success: true as const }
}

export async function atualizarStatusObjetivo(id: number, status: "concluido" | "cancelado" | "proposto") {
  await requireAuth(["admin", "tecnico"])
  if (!Number.isInteger(id) || !["concluido", "cancelado", "proposto"].includes(status)) return { error: "Atualização inválida." }
  const objetivo = await db.objetivoCompartilhado.findUnique({ where: { id }, select: { id: true } })
  if (!objetivo) return { error: "Objetivo não encontrado." }
  await db.objetivoCompartilhado.update({
    where: { id },
    data: { status, encerradoEm: status === "concluido" || status === "cancelado" ? new Date() : null },
  })
  revalidatePath("/desenvolvimento")
  revalidatePath("/responsavel/desempenho")
  return { success: true as const }
}

export async function responderObjetivoFamilia(id: number, resposta: "combinado" | "revisao_solicitada", observacao: string) {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) return { error: "Sessão expirada. Entre novamente." }
  if (!Number.isInteger(id) || !["combinado", "revisao_solicitada"].includes(resposta)) return { error: "Resposta inválida." }
  const texto = observacao.trim()
  if (resposta === "revisao_solicitada" && texto.length < 3) return { error: "Explique brevemente o que precisa ser conversado." }
  if (texto.length > 800) return { error: "Comentário muito longo." }
  const objetivo = await db.objetivoCompartilhado.findFirst({
    where: { id, aluno: { responsavelId: session.responsavelId, status: "Ativo" }, status: { in: ["proposto", "combinado", "revisao_solicitada"] } },
    select: { id: true },
  })
  if (!objetivo) return { error: "Objetivo não encontrado para esta família." }
  await db.objetivoCompartilhado.update({
    where: { id },
    data: { status: resposta, respostaFamilia: texto || null, confirmadoEm: resposta === "combinado" ? new Date() : null },
  })
  revalidatePath("/responsavel/desempenho")
  revalidatePath("/desenvolvimento")
  return { success: true as const }
}
