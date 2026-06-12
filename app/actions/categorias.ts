"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"
import { extrairCategorias, categoriaIdeal } from "@/lib/categorias"

type ActionResult = { success: true; aplicadas: number } | { error: string }

export async function aplicarViradaCategorias(alunoIds: number[]): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  if (alunoIds.length === 0) return { error: "Nenhuma mudança selecionada." }

  try {
    type LogEntry = { alunoId: number; nome: string; de: string; para: string }
    // A turma de destino é re-derivada aqui (não vem do cliente): mesma regra do preview
    const { aplicadas, logs } = await db.$transaction(async (tx) => {
      const ativos = await tx.aluno.findMany({
        where: { status: "Ativo" },
        select: { id: true, nome: true, dataNascimento: true, turma: true },
      })
      const categorias = extrairCategorias(ativos.map((a) => a.turma))
      const anoRef = new Date().getFullYear()
      const selecionados = new Set(alunoIds)

      let aplicadas = 0
      const logs: LogEntry[] = []
      for (const aluno of ativos) {
        if (!selecionados.has(aluno.id)) continue
        const proposta = categoriaIdeal(aluno.dataNascimento, anoRef, categorias)
        if (proposta == null || proposta === aluno.turma) continue
        await tx.aluno.update({ where: { id: aluno.id }, data: { turma: proposta } })
        logs.push({ alunoId: aluno.id, nome: aluno.nome, de: aluno.turma, para: proposta })
        aplicadas++
      }
      return { aplicadas, logs }
    })

    for (const l of logs) {
      await registrarLog("categoria", `Virada de categoria: ${l.nome} ${l.de} → ${l.para}`, {
        alunoId: l.alunoId, de: l.de, para: l.para,
      })
    }

    revalidatePath("/alunos")
    revalidatePath("/configuracoes/categorias")
    return { success: true, aplicadas }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao aplicar virada" }
  }
}
