"use server"

import { requireAuth } from "@/lib/auth"

export async function dispararCron() {
  await requireAuth(["admin"])
  return { error: "O disparo manual foi desativado. As automações seguem apenas o agendamento do sistema." }
}
