import fs from "fs"
import path from "path"
import { resolveClubConfigPath } from "../lib/config"
import { resolveDbPath } from "../lib/db-path"
import { resolveUploadsBaseDir } from "../lib/uploads-path"
import { BACKUP_BUNDLE_SUFFIX, createBackupBundle } from "./backup-bundle"
import { loadEnv } from "./load-env"

loadEnv()

const DB_PATH = resolveDbPath()
const DB_PREFIX = path.basename(DB_PATH, ".db")
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups")
const MAX_BACKUPS = Number(process.env.BACKUP_RETENTION_COUNT ?? 30)

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("❌ Banco de dados não encontrado:", DB_PATH)
    process.exit(1)
  }

  const backupPath = await createBackupBundle({
    dbPath: DB_PATH,
    uploadsDir: resolveUploadsBaseDir(),
    configPath: resolveClubConfigPath(),
    backupDir: BACKUP_DIR,
    prefix: DB_PREFIX,
  })
  const backupName = path.basename(backupPath)
  const manifest = fs.statSync(path.join(backupPath, "manifest.json"))
  console.log(`✅ Backup completo criado: ${backupName} (SQLite, uploads e configuração; manifesto ${manifest.size} bytes)`)

  const backups = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${DB_PREFIX}-`) && entry.name.endsWith(BACKUP_BUNDLE_SUFFIX))
    .map((entry) => entry.name)
    .sort()
    .reverse()

  if (Number.isInteger(MAX_BACKUPS) && MAX_BACKUPS > 0 && backups.length > MAX_BACKUPS) {
    for (const old of backups.slice(MAX_BACKUPS)) {
      fs.rmSync(path.join(BACKUP_DIR, old), { recursive: true, force: true })
      console.log(`🗑️  Removido backup antigo: ${old}`)
    }
  }

  const totalMantido = Number.isInteger(MAX_BACKUPS) && MAX_BACKUPS > 0
    ? Math.min(backups.length, MAX_BACKUPS)
    : backups.length
  console.log(`📦 Total de backups completos: ${totalMantido}`)
}

main().catch((error) => {
  console.error("❌ Falha ao criar backup:", error)
  process.exit(1)
})
