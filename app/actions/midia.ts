"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { registrarLog } from "@/app/actions/log"

export async function adicionarMidia(data: {
  tipo: "video" | "fotos"
  titulo: string
  url: string
  partidaId?: number
  campeonatoId?: number
}) {
  await requireAuth(["admin", "secretaria"])

  if (!data.titulo.trim()) return { error: "Título obrigatório" }
  if (!data.url.trim()) return { error: "URL obrigatória" }
  try {
    new URL(data.url)
  } catch {
    return { error: "URL inválida" }
  }
  if (!data.partidaId && !data.campeonatoId) return { error: "Vincule a uma partida ou campeonato" }
  if (data.partidaId && data.campeonatoId) return { error: "Vincule a apenas uma partida ou campeonato" }

  try {
    await db.media.create({ data })
    void registrarLog("midia_adicionada", `Mídia adicionada — ${data.titulo}`, { tipo: data.tipo })
    revalidatePath("/configuracoes/midia")
    revalidatePath("/responsavel/galeria")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar mídia" }
  }
}

export async function removerMidia(id: number) {
  await requireAuth(["admin", "secretaria"])
  try {
    const midia = await db.media.findUnique({ where: { id }, select: { titulo: true, tipo: true } })
    await db.media.delete({ where: { id } })
    void registrarLog("midia_removida", `Mídia removida — ${midia?.titulo ?? `ID ${id}`}`, { id, tipo: midia?.tipo })
    revalidatePath("/configuracoes/midia")
    revalidatePath("/responsavel/galeria")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao remover mídia" }
  }
}
