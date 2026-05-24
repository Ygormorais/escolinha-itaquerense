"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"

export async function reativarEscalacao(telefone: string) {
  await requireAuth()
  await db.chatSession.update({
    where: { telefone },
    data: { bloqueado: false },
  })
  revalidatePath("/configuracoes/escalacoes")
  return { success: true }
}
