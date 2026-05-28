"use server"

import { requireAuth } from "@/lib/auth"
import {
  runEnviarLembreteVencendo,
  runEnviarLembretesInadimplentes,
  type ResultadoEmail,
} from "@/lib/email-jobs"

export type { ResultadoEmail }

export async function enviarLembretesInadimplentes(): Promise<ResultadoEmail | { error: string }> {
  await requireAuth()
  return runEnviarLembretesInadimplentes()
}

export async function enviarLembreteVencendo(): Promise<ResultadoEmail | { error: string }> {
  await requireAuth()
  return runEnviarLembreteVencendo()
}
