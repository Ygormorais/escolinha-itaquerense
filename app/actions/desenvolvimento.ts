"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { registrarLog } from "@/app/actions/log"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { carregarPainelDesenvolvimento, type StatusAcaoDesenvolvimento } from "@/lib/desenvolvimento-data"
import { insightKeySemanal } from "@/lib/desenvolvimento"
import { gerarRascunhoComIA, personalizarMensagemFamilia } from "@/lib/desenvolvimento-ai"
import { preferenciasCopilotoSchema, type PreferenciasCopiloto } from "@/lib/desenvolvimento-copiloto"

const inputSchema = z.object({
  insightId: z.string().min(3).max(100),
  status: z.enum(["pendente", "concluida", "ignorada"]),
  observacao: z.string().trim().max(500).optional(),
})

const draftApprovalSchema = z.object({
  revisado: z.literal(true),
  insightId: z.string().min(3).max(100),
  planoSemanal: z.array(z.string().trim().min(5).max(300)).min(2).max(5),
  mensagemFamilia: z.string().trim().min(30).max(1000),
  fonte: z.enum(["ia", "modelo_local"]),
})

async function findActiveInsight(insightId: string, now: Date) {
  const panel = await carregarPainelDesenvolvimento({ now })
  return panel.insights.find((item) => item.id === insightId && !item.positivo) ?? null
}

export async function atualizarAcaoDesenvolvimento(input: {
  insightId: string
  status: StatusAcaoDesenvolvimento
  observacao?: string
}) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) return { error: "Dados inválidos para atualizar a ação." }
  if (parsed.data.status === "ignorada" && (parsed.data.observacao?.length ?? 0) < 3) {
    return { error: "Informe uma justificativa para ignorar esta recomendação." }
  }
  if (parsed.data.status === "concluida" && (parsed.data.observacao?.length ?? 0) < 3) {
    return { error: "Registre brevemente o resultado antes de concluir a ação." }
  }

  const now = new Date()
  const insight = await findActiveInsight(parsed.data.insightId, now)
  if (!insight) return { error: "Este indicador não está mais ativo. Atualize a página." }

  const insightKey = insightKeySemanal(insight, now)
  await db.acaoDesenvolvimento.upsert({
    where: { insightKey },
    create: {
      alunoId: insight.alunoId,
      insightKey,
      tipo: insight.tipo,
      titulo: insight.titulo,
      acao: insight.acaoSugerida,
      status: parsed.data.status,
      observacao: parsed.data.observacao || null,
      usuario: auth.user,
      concluidaEm: parsed.data.status === "concluida" ? now : null,
    },
    update: {
      status: parsed.data.status,
      observacao: parsed.data.observacao || null,
      usuario: auth.user,
      concluidaEm: parsed.data.status === "concluida" ? now : null,
    },
  })
  await registrarLog("acao_desenvolvimento_atualizada", `${insight.titulo} — ${insight.alunoNome}`, {
    alunoId: insight.alunoId,
    insightKey,
    status: parsed.data.status,
  })
  revalidatePath("/desenvolvimento")
  revalidatePath(`/alunos/${insight.alunoId}`)
  return { success: true }
}

export async function gerarRascunhoDesenvolvimento(insightId: string, preferencias?: Partial<PreferenciasCopiloto>) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.string().min(3).max(100).safeParse(insightId)
  if (!parsed.success) return { error: "Indicador inválido." }
  const opcoes = preferenciasCopilotoSchema.safeParse(preferencias ?? {})
  if (!opcoes.success) return { error: "Escolha um foco e um modo de geração válidos." }

  const now = new Date()
  const insight = await findActiveInsight(parsed.data, now)
  if (!insight) return { error: "Este indicador não está mais ativo. Atualize a página." }

  const draft = await gerarRascunhoComIA(insight, opcoes.data)
  await registrarLog("rascunho_desenvolvimento_gerado", `Rascunho gerado — ${insight.alunoNome}`, {
    alunoId: insight.alunoId,
    tipo: insight.tipo,
    fonte: draft.fonte,
    foco: opcoes.data.foco,
    modo: opcoes.data.modo,
    usuario: auth.user,
  })
  return {
    success: true as const,
    draft: {
      ...draft,
      mensagemFamilia: personalizarMensagemFamilia(draft.mensagemFamilia, insight.alunoNome),
    },
  }
}

export async function aprovarRascunhoDesenvolvimento(input: {
  revisado: boolean
  insightId: string
  planoSemanal: string[]
  mensagemFamilia: string
  fonte: "ia" | "modelo_local"
}) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = draftApprovalSchema.safeParse(input)
  if (!parsed.success) return { error: "Revise o plano e a mensagem antes de salvar." }

  const now = new Date()
  const insight = await findActiveInsight(parsed.data.insightId, now)
  if (!insight) return { error: "Este indicador não está mais ativo. Atualize a página." }
  const insightKey = insightKeySemanal(insight, now)

  await db.acaoDesenvolvimento.upsert({
    where: { insightKey },
    create: {
      alunoId: insight.alunoId,
      insightKey,
      tipo: insight.tipo,
      titulo: insight.titulo,
      acao: insight.acaoSugerida,
      status: "pendente",
      usuario: auth.user,
      planoSemanal: JSON.stringify(parsed.data.planoSemanal),
      mensagemFamilia: parsed.data.mensagemFamilia,
      rascunhoFonte: parsed.data.fonte,
      rascunhoAprovadoEm: now,
    },
    update: {
      status: "pendente",
      usuario: auth.user,
      planoSemanal: JSON.stringify(parsed.data.planoSemanal),
      mensagemFamilia: parsed.data.mensagemFamilia,
      rascunhoFonte: parsed.data.fonte,
      rascunhoAprovadoEm: now,
      concluidaEm: null,
    },
  })
  await registrarLog("rascunho_desenvolvimento_aprovado", `Plano aprovado — ${insight.alunoNome}`, {
    alunoId: insight.alunoId,
    insightKey,
    fonte: parsed.data.fonte,
  })
  revalidatePath("/desenvolvimento")
  revalidatePath(`/alunos/${insight.alunoId}`)
  return { success: true as const }
}
