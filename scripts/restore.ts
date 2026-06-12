import fs from "fs"
import path from "path"
import { resolveDbPath } from "../lib/db-path"

const DB_PATH = resolveDbPath()
const DB_PREFIX = path.basename(DB_PATH, ".db")
const BACKUP_DIR = path.join(process.cwd(), "backups")

function main() {
  const backupFile = process.argv[2]

  if (!backupFile) {
    console.error("Uso: npx tsx scripts/restore.ts <arquivo-backup>")
    console.error("")
    console.error("Backups disponíveis:")
    if (fs.existsSync(BACKUP_DIR)) {
      const backups = fs.readdirSync(BACKUP_DIR)
        .filter((f) => f.startsWith(`${DB_PREFIX}-`) && f.endsWith(".db"))
        .sort()
        .reverse()
      if (backups.length === 0) {
        console.error("  (nenhum backup encontrado)")
      } else {
        for (const b of backups) {
          const stats = fs.statSync(path.join(BACKUP_DIR, b))
          const sizeKB = (stats.size / 1024).toFixed(1)
          console.error(`  ${b} (${sizeKB} KB)`)
        }
      }
    }
    process.exit(1)
  }

  const backupPath = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(BACKUP_DIR, backupFile)

  if (!fs.existsSync(backupPath)) {
    console.error("❌ Backup não encontrado:", backupPath)
    process.exit(1)
  }

  const stats = fs.statSync(backupPath)
  if (stats.size === 0) {
    console.error("❌ Backup está vazio:", backupPath)
    process.exit(1)
  }

  if (fs.existsSync(DB_PATH)) {
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const preRestorePath = path.join(BACKUP_DIR, `pre-restore-${timestamp}.db`)
    fs.copyFileSync(DB_PATH, preRestorePath)
    console.log(`📋 Backup pré-restauração criado: pre-restore-${timestamp}.db`)
  }

  fs.copyFileSync(backupPath, DB_PATH)
  const sizeKB = (stats.size / 1024).toFixed(1)
  console.log(`✅ Banco restaurado de: ${backupFile} (${sizeKB} KB)`)
  console.log(`⚠️  Reinicie o servidor para aplicar as mudanças.`)
}

main()
