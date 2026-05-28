import { execSync } from "child_process"
import fs from "fs"
import path from "path"

const BACKUP_DIR = path.join(process.cwd(), "backups")

function main() {
  const backupFile = process.argv[2]

  if (!backupFile) {
    console.error("Uso: npx tsx scripts/restore.ts <arquivo-backup>")
    console.error("")
    console.error("Backups disponíveis:")
    if (fs.existsSync(BACKUP_DIR)) {
      const backups = fs.readdirSync(BACKUP_DIR)
        .filter((f) => (f.startsWith("prod-") || f.startsWith("dev-")) && (f.endsWith(".sql") || f.endsWith(".db")))
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

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error("❌ DATABASE_URL não configurada")
    process.exit(1)
  }

  console.log(`⚠️  Isso vai SUBSTITUIR todos os dados do banco atual!`)
  console.log(`📁 Restaurando de: ${backupFile}`)

  try {
    execSync(`psql "${dbUrl}" -f "${backupPath}" --no-owner --no-acl`, {
      stdio: "pipe",
    })
  } catch (e) {
    console.error("❌ Erro ao executar psql. Instale o PostgreSQL client.")
    process.exit(1)
  }

  const sizeKB = (stats.size / 1024).toFixed(1)
  console.log(`✅ Banco restaurado de: ${backupFile} (${sizeKB} KB)`)
  console.log(`⚠️  Reinicie o servidor para aplicar as mudanças.`)
}

main()
