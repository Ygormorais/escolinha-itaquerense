import { logger } from "@/lib/logger"

const DUAS_HORAS_MS = 2 * 60 * 60 * 1000
const PRIMEIRA_EXECUCAO_MS = 2 * 60 * 1000

let timer: ReturnType<typeof setInterval> | null = null
let primeira: ReturnType<typeof setTimeout> | null = null
let rodando = false

/** Chama o próprio endpoint de cron: assim a revalidação das páginas roda no contexto de uma requisição. */
export async function executarSyncFpfs(env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const secret = env.CRON_SECRET
  if (!secret) return false
  if (rodando) return false
  rodando = true
  try {
    const porta = env.PORT ?? "3000"
    const res = await fetch(`http://127.0.0.1:${porta}/api/cron/fpfs`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(5 * 60 * 1000),
    })
    if (!res.ok) logger.error("fpfs auto-sync: endpoint respondeu erro", { status: res.status })
    return res.ok
  } catch (e) {
    logger.error("fpfs auto-sync: falha", { error: String(e) })
    return false
  } finally {
    rodando = false
  }
}

/**
 * Sincroniza com a FPFS a cada 2 horas dentro do próprio servidor (Railway/VPS com processo
 * contínuo). Desligue com FPFS_AUTO_SYNC=0 se usar um cron externo;
 * em desenvolvimento, ligue com FPFS_AUTO_SYNC=1.
 */
export function iniciarSyncAutomatico(env: NodeJS.ProcessEnv = process.env): boolean {
  if (timer) return false
  if (!env.CRON_SECRET || env.FPFS_AUTO_SYNC === "0") return false
  // Em desenvolvimento só liga por opt-in (FPFS_AUTO_SYNC=1), para não buscar a FPFS sem querer.
  if (env.NODE_ENV !== "production" && env.FPFS_AUTO_SYNC !== "1") return false
  primeira = setTimeout(() => void executarSyncFpfs(env), PRIMEIRA_EXECUCAO_MS)
  timer = setInterval(() => void executarSyncFpfs(env), DUAS_HORAS_MS)
  primeira.unref?.()
  timer.unref?.()
  return true
}
