"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { registrarLog } from "@/app/actions/log"

export async function encerrarPendenciaDesenvolvimento(input: {
  id: number; versao: string; status: "concluida" | "ignorada"; observacao: string
}) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.object({
    id: z.number().int().positive(), versao: z.iso.datetime(),
    status: z.enum(["concluida", "ignorada"]), observacao: z.string().trim().min(3).max(500),
  }).safeParse(input)
  if (!parsed.success) return { error: "Informe um resultado ou justificativa de 3 a 500 caracteres." }
  const acao = await db.acaoDesenvolvimento.findUnique({
    where: { id: parsed.data.id },
    select: { alunoId: true, titulo: true, insightKey: true, aluno: { select: { nome: true } } },
  })
  if (!acao) return { error: "Esta ação não existe mais. Atualize a consulta." }
  const now = new Date()
  const result = await db.acaoDesenvolvimento.updateMany({
    // Comparação atômica: uma tela antiga não pode apagar o registro de outra pessoa.
    where: { id: parsed.data.id, status: "pendente", updatedAt: new Date(parsed.data.versao) },
    data: { status: parsed.data.status, observacao: parsed.data.observacao, usuario: auth.user, concluidaEm: parsed.data.status === "concluida" ? now : null, updatedAt: now },
  })
  if (result.count === 0) return { error: "A ação foi alterada ou encerrada por outra pessoa. Feche esta janela e atualize a consulta antes de continuar.", conflito: true }
  await registrarLog("acao_desenvolvimento_atualizada", `${acao.titulo} — ${acao.aluno.nome}`, {
    alunoId: acao.alunoId, insightKey: acao.insightKey, status: parsed.data.status, origem: "pendencia_registrada",
  })
  revalidatePath("/desenvolvimento")
  revalidatePath(`/alunos/${acao.alunoId}`)
  return { success: true }
}

export async function listarPendenciasDesenvolvimento(input: { alunoId?: number; depoisDe?: number }) {
  await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ alunoId: z.number().int().positive().optional(), depoisDe: z.number().int().positive().optional() }).safeParse(input)
  if (!parsed.success) return { error: "Atleta ou página inválidos." }
  const rows = await db.acaoDesenvolvimento.findMany({
    where: { status: "pendente", ...(parsed.data.alunoId ? { alunoId: parsed.data.alunoId } : {}), ...(parsed.data.depoisDe ? { id: { gt: parsed.data.depoisDe } } : {}) },
    select: { id: true, alunoId: true, aluno: { select: { nome: true, turma: true } }, titulo: true, observacao: true, usuario: true, planoSemanal: true, insightKey: true, updatedAt: true },
    orderBy: { id: "asc" }, take: 21,
  })
  const itens = rows.slice(0, 20).map((row) => {
    let planoSemanal: string[] | null = null
    try {
      const plano = z.array(z.string()).safeParse(JSON.parse(row.planoSemanal ?? "null"))
      if (plano.success) planoSemanal = plano.data
    } catch { /* Planos legados inválidos não impedem o encerramento da pendência. */ }
    return {
      id: row.id, alunoId: row.alunoId, alunoNome: row.aluno.nome, turma: row.aluno.turma,
      titulo: row.titulo, observacao: row.observacao, usuario: row.usuario, planoSemanal,
      cicloInicio: row.insightKey.split(":").at(-1) ?? "", updatedAt: row.updatedAt.toISOString(), status: "pendente" as const,
    }
  })
  return { itens, proximaPagina: rows.length > 20 ? itens.at(-1)!.id : null }
}
