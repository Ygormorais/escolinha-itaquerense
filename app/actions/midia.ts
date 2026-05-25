"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"

export async function adicionarMidia(data: {
  tipo: "video" | "fotos"
  titulo: string
  url: string
  partidaId?: number
  campeonatoId?: number
}) {
  await requireAuth()

  if (!data.titulo.trim()) return { error: "Título obrigatório" }
  if (!data.url.trim()) return { error: "URL obrigatória" }
  if (!data.partidaId && !data.campeonatoId) return { error: "Vincule a uma partida ou campeonato" }
  if (data.partidaId && data.campeonatoId) return { error: "Vincule a apenas uma partida ou campeonato" }

  try {
    await db.media.create({ data })
    revalidatePath("/configuracoes/midia")
    return { success: true }
  } catch {
    return { error: "Erro ao salvar mídia" }
  }
}

export async function removerMidia(id: number) {
  await requireAuth()
  try {
    await db.media.delete({ where: { id } })
    revalidatePath("/configuracoes/midia")
    return { success: true }
  } catch {
    return { error: "Erro ao remover mídia" }
  }
}
