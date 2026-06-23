"use server"

import { requireAuth } from "@/lib/auth"
import { getCronSecret } from "@/lib/env"

export async function dispararCron() {
  await requireAuth()

  const secret = getCronSecret()
  if (!secret) return { error: "CRON_SECRET não configurado" }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/cron/lembretes`, {
      headers: { Authorization: `Bearer ${secret}` },
    })
    if (!res.ok) return { error: `Erro HTTP ${res.status}` }
    return await res.json()
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Falha ao executar o cron" }
  }
}
