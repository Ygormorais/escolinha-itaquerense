"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function registrarLog(tipo: string, descricao: string, meta?: Record<string, unknown>) {
  let usuario: string | null = null
  try {
    const auth = await requireAuth()
    usuario = auth.user
  } catch {
    // sem autenticação (cron, chatbot, etc)
  }
  try {
    await db.log.create({
      data: {
        tipo,
        descricao,
        usuario,
        meta: meta ? JSON.stringify(meta) : null,
      },
    })
  } catch {
    // log silently — never block the main action
  }
}
