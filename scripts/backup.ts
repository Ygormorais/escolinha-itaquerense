import fs from "fs"
import path from "path"
import Database from "better-sqlite3"
import { resolveDbPath } from "../lib/db-path"
import { loadEnv } from "./load-env"

loadEnv()

const DB_PATH = resolveDbPath()
const DB_PREFIX = path.basename(DB_PATH, ".db")
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups")
const MAX_BACKUPS = Number(process.env.BACKUP_RETENTION_COUNT ?? 30)

async function criarBackupConsistente(destino: string) {
  const origem = new Database(DB_PATH, { readonly: true, fileMustExist: true })
  try {
    await origem.backup(destino)
  } finally {
    origem.close()
  }

  const copia = new Database(destino, { readonly: true, fileMustExist: true })
  try {
    const resultado = copia.pragma("quick_check", { simple: true })
    if (resultado !== "ok") throw new Error(`PRAGMA quick_check retornou: ${String(resultado)}`)
  } finally {
    copia.close()
  }
}

async function main() {
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

  await criarBackupConsistente(backupPath)

  const stats = fs.statSync(backupPath)
  if (stats.size === 0) {
    fs.unlinkSync(backupPath)
    throw new Error("backup gerado vazio")
  }
  const sizeKB = (stats.size / 1024).toFixed(1)

  console.log(`✅ Backup criado: ${backupName} (${sizeKB} KB, SQLite online backup validado)`)

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

  const totalMantido = Number.isInteger(MAX_BACKUPS) && MAX_BACKUPS > 0
    ? Math.min(backups.length, MAX_BACKUPS)
    : backups.length
  console.log(`📦 Total de backups: ${totalMantido}`)
}

main().catch((error) => {
  console.error("❌ Falha ao criar backup:", error)
  process.exit(1)
})
