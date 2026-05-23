"use server"

import { db } from "@/lib/db"

export async function registrarLog(tipo: string, descricao: string, meta?: Record<string, unknown>) {
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
