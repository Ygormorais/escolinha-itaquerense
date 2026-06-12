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
    let aplicadas = 0
    for (const m of mudancas) {
      const aluno = await db.aluno.findUnique({ where: { id: m.alunoId }, select: { turma: true, nome: true } })
      if (!aluno) continue
      await db.aluno.update({ where: { id: m.alunoId }, data: { turma: m.novaTurma } })
      await registrarLog("categoria", `Virada de categoria: ${aluno.nome} ${aluno.turma} → ${m.novaTurma}`, {
        alunoId: m.alunoId, de: aluno.turma, para: m.novaTurma,
      })
      aplicadas++
    }
    revalidatePath("/alunos")
    revalidatePath("/configuracoes/categorias")
    return { success: true, aplicadas }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao aplicar virada" }
  }
}
