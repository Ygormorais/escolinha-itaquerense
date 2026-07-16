import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"
import { resolveDbPath } from "../lib/db-path"

const DB_PATH = resolveDbPath()
const DB_PREFIX = path.basename(DB_PATH, ".db")
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups")
const MAX_BACKUPS = Number(process.env.BACKUP_RETENTION_DAYS ?? 30)

function criarBackupConsistente(destino: string) {
  // Copiar um SQLite em uso pode capturar apenas parte de uma transação. Na VPS
  // o sqlite3 está instalado pelo setup; o fallback mantém o script útil no dev.
  const sqlite = spawnSync("sqlite3", [DB_PATH, `.backup ${destino}`], { encoding: "utf8" })
  if (!sqlite.error && sqlite.status === 0) return "sqlite3"

  fs.copyFileSync(DB_PATH, destino)
  return "cópia direta (use sqlite3 em produção)"
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("❌ Banco de dados não encontrado:", DB_PATH)
    process.exit(1)
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const backupName = `${DB_PREFIX}-${timestamp}.db`
  const backupPath = path.join(BACKUP_DIR, backupName)

  const metodo = criarBackupConsistente(backupPath)

  const stats = fs.statSync(backupPath)
  if (stats.size === 0) {
    fs.unlinkSync(backupPath)
    throw new Error("backup gerado vazio")
  }
  const sizeKB = (stats.size / 1024).toFixed(1)

  console.log(`✅ Backup criado: ${backupName} (${sizeKB} KB, ${metodo})`)

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith(`${DB_PREFIX}-`) && f.endsWith(".db"))
    .sort()
    .reverse()

  if (Number.isInteger(MAX_BACKUPS) && MAX_BACKUPS > 0 && backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS)
    for (const old of toDelete) {
      fs.unlinkSync(path.join(BACKUP_DIR, old))
      console.log(`🗑️  Removido backup antigo: ${old}`)
    }
  }

  console.log(`📦 Total de backups: ${Math.min(backups.length, MAX_BACKUPS)}`)
}

main()
