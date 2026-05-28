"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function registrarLog(tipo: string, descricao: string, meta?: Record<string, unknown>) {
  await requireAuth()
  try {
    await db.log.create({
      data: {
        tipo,
        descricao,
        meta: meta ? JSON.stringify(meta) : null,
      },
    })
  } catch {
    // log silently — never block the main action
  }
}
