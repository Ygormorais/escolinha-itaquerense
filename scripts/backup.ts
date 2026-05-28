import fs from "fs"
import path from "path"

const DB_PATH = path.join(process.cwd(), "prisma", "dev.db")
const BACKUP_DIR = path.join(process.cwd(), "backups")
const MAX_BACKUPS = 30

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
  const backupName = `dev-${timestamp}.db`
  const backupPath = path.join(BACKUP_DIR, backupName)

  fs.copyFileSync(DB_PATH, backupPath)

  const stats = fs.statSync(backupPath)
  const sizeKB = (stats.size / 1024).toFixed(1)

  console.log(`✅ Backup criado: ${backupName} (${sizeKB} KB)`)

  // Rotacionar: manter apenas MAX_BACKUPS
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("dev-") && f.endsWith(".db"))
    .sort()
    .reverse()

  if (backups.length > MAX_BACKUPS) {
    const toDelete = backups.slice(MAX_BACKUPS)
    for (const old of toDelete) {
      fs.unlinkSync(path.join(BACKUP_DIR, old))
      console.log(`🗑️  Removido backup antigo: ${old}`)
    }
  }

  console.log(`📦 Total de backups: ${Math.min(backups.length, MAX_BACKUPS)}`)
}

main()
