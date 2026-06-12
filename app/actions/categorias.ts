"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"

type Mudanca = { alunoId: number; novaTurma: string }
type ActionResult = { success: true; aplicadas: number } | { error: string }

export async function aplicarViradaCategorias(mudancas: Mudanca[]): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  if (mudancas.length === 0) return { error: "Nenhuma mudança selecionada." }
  if (mudancas.some((m) => !/^Sub-\d+$/.test(m.novaTurma))) {
    return { error: "Turma proposta inválida." }
  }

  try {
    type LogEntry = { alunoId: number; nome: string; de: string; para: string }
    const { aplicadas, logs } = await db.$transaction(async (tx) => {
      let aplicadas = 0
      const logs: LogEntry[] = []
      for (const m of mudancas) {
        const aluno = await tx.aluno.findUnique({ where: { id: m.alunoId }, select: { turma: true, nome: true } })
        if (!aluno) continue
        await tx.aluno.update({ where: { id: m.alunoId }, data: { turma: m.novaTurma } })
        logs.push({ alunoId: m.alunoId, nome: aluno.nome, de: aluno.turma, para: m.novaTurma })
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
