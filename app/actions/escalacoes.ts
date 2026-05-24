"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"

export async function reativarEscalacao(telefone: string) {
  await requireAuth()
  try {
    await db.chatSession.update({
      where: { telefone },
      data: { bloqueado: false },
    })
    revalidatePath("/configuracoes/escalacoes")
    return { success: true }
  } catch {
    return { error: "Erro ao reativar escalação" }
  }
}
