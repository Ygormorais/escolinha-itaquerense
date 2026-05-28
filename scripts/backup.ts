import { execSync } from "child_process"
import fs from "fs"
import path from "path"

const BACKUP_DIR = path.join(process.cwd(), "backups")
const MAX_BACKUPS = 30

function main() {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error("❌ DATABASE_URL não configurada")
    process.exit(1)
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }

  const now = new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const backupName = `prod-${timestamp}.sql`
  const backupPath = path.join(BACKUP_DIR, backupName)

  try {
    execSync(`pg_dump "${dbUrl}" -F p -f "${backupPath}" --no-owner --no-acl`, {
      stdio: "pipe",
    })
  } catch (e) {
    console.error("❌ Erro ao executar pg_dump. Instale o PostgreSQL client.")
    console.error("   Ubuntu: sudo apt install postgresql-client")
    console.error("   macOS: brew install postgresql")
    console.error("   Windows: https://www.postgresql.org/download/windows/")
    process.exit(1)
  }

  const stats = fs.statSync(backupPath)
  const sizeKB = (stats.size / 1024).toFixed(1)

  console.log(`✅ Backup criado: ${backupName} (${sizeKB} KB)`)

  // Rotacionar: manter apenas MAX_BACKUPS
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("prod-") && f.endsWith(".sql"))
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
