"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

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
  await requireAuth()
  if (!data.item?.trim()) return { error: "Item de uniforme é obrigatório" }
  try {
    await db.uniforme.create({
      data: { alunoId, item: data.item.trim(), tamanho: data.tamanho ?? null, observacoes: data.observacoes ?? null },
    })
    revalidatePath(`/alunos/${alunoId}`)
    revalidatePath("/uniformes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao adicionar uniforme" }
  }
}

export async function marcarEntregue(id: number, alunoId: number): Promise<ActionResult> {
  await requireAuth()
  try {
    await db.uniforme.update({
      where: { id },
      data: { entregue: true, dataEntrega: new Date() },
    })
    revalidatePath(`/alunos/${alunoId}`)
    revalidatePath("/uniformes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao marcar entrega" }
  }
}

export async function removerUniforme(id: number, alunoId: number): Promise<ActionResult> {
  await requireAuth()
  try {
    await db.uniforme.delete({ where: { id } })
    revalidatePath(`/alunos/${alunoId}`)
    revalidatePath("/uniformes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao remover uniforme" }
  }
}
