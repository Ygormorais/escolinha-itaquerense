"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"

type ActionResult = { success: true } | { error: string }

export async function getUniformes(alunoId: number) {
  return db.uniforme.findMany({
    where: { alunoId },
    orderBy: { createdAt: "asc" },
  })
}

export async function adicionarUniforme(alunoId: number, data: {
  item: string
  tamanho?: string
  observacoes?: string
}): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  if (!data.item?.trim()) return { error: "Item de uniforme é obrigatório" }
  try {
    await db.uniforme.create({
      data: { alunoId, item: data.item.trim(), tamanho: data.tamanho ?? null, observacoes: data.observacoes ?? null },
    })
    void registrarLog("uniforme_adicionado", `Uniforme adicionado — aluno ID ${alunoId}`, { item: data.item.trim() })
    revalidatePath(`/alunos/${alunoId}`)
    revalidatePath("/uniformes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao adicionar uniforme" }
  }
}

export async function marcarEntregue(id: number, alunoId: number): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  try {
    await db.uniforme.update({
      where: { id },
      data: { entregue: true, dataEntrega: new Date() },
    })
    void registrarLog("uniforme_entregue", `Uniforme ID ${id} marcado como entregue — aluno ID ${alunoId}`)
    revalidatePath(`/alunos/${alunoId}`)
    revalidatePath("/uniformes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao marcar entrega" }
  }
}

export async function removerUniforme(id: number, alunoId: number): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])
  try {
    await db.uniforme.delete({ where: { id } })
    void registrarLog("uniforme_removido", `Uniforme ID ${id} removido — aluno ID ${alunoId}`)
    revalidatePath(`/alunos/${alunoId}`)
    revalidatePath("/uniformes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao remover uniforme" }
  }
}
