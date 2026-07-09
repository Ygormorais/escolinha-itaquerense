/**
 * Daemon local: sincroniza a FPFS a cada 2 horas sem intervenção.
 * Mantém rodando em background (npm run fpfs:daemon).
 */
import fs from "fs"
import path from "path"
import { loadEnv } from "./load-env"

loadEnv()

const INTERVAL_MS = 2 * 60 * 60 * 1000 // 2h
const LOG = path.join(process.cwd(), "logs", "fpfs-cron.log")

function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  try {
    fs.mkdirSync(path.dirname(LOG), { recursive: true })
    fs.appendFileSync(LOG, line + "\n")
  } catch {
    /* ignore log errors */
  }
}

async function tick() {
  try {
    const { syncTodos } = await import("../lib/fpfs/sync")
    log("Iniciando sync FPFS…")
    const resumos = await syncTodos()
    const novos = resumos.reduce((s, r) => s + r.jogosNovos, 0)
    const upd = resumos.reduce((s, r) => s + r.jogosAtualizados, 0)
    const errs = resumos.filter((r) => r.erro).length
    log(`OK ${resumos.length} camps | +${novos} novos | ~${upd} upd | erros ${errs}`)
    // Páginas com force-dynamic leem o SQLite em cada request — sem revalidate HTTP.
  } catch (e) {
    log(`FALHA: ${e instanceof Error ? e.message : String(e)}`)
  }
}

log(`Daemon FPFS iniciado (intervalo ${INTERVAL_MS / 3600000}h). Ctrl+C para parar.`)
void tick()
setInterval(() => void tick(), INTERVAL_MS)

// Mantém o processo vivo
process.stdin.resume()
