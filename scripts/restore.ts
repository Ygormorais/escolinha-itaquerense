import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"
import { resolveClubConfigPath } from "../lib/config"
import { resolveDbPath } from "../lib/db-path"
import { resolveUploadsBaseDir } from "../lib/uploads-path"
import {
  BACKUP_BUNDLE_SUFFIX,
  createBackupBundle,
  restoreBackupBundle,
  validateSqlite,
} from "./backup-bundle"
import { loadEnv } from "./load-env"

loadEnv()

const DB_PATH = resolveDbPath()
const DB_PREFIX = path.basename(DB_PATH, ".db")
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups")
const LOCATIONS = {
  dbPath: DB_PATH,
  uploadsDir: resolveUploadsBaseDir(),
  configPath: resolveClubConfigPath(),
}
const REQUIRED_PM2_SERVICES = new Set(["escolinha"])

function exigirServicosParados() {
  const result = spawnSync("pm2", ["jlist"], { encoding: "utf8" })
  const code = (result.error as NodeJS.ErrnoException | undefined)?.code
  if (code === "ENOENT") return
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Não foi possível consultar o PM2: ${result.stderr.trim()}`)

  const apps = JSON.parse(result.stdout) as Array<{ name?: string; pm2_env?: { status?: string } }>
  const ativos = apps
    .filter((app) => app.name && REQUIRED_PM2_SERVICES.has(app.name))
    .filter((app) => app.pm2_env?.status !== "stopped")
    .map((app) => `${app.name} (${app.pm2_env?.status ?? "status desconhecido"})`)

  if (ativos.length > 0) throw new Error(`Pare o serviço antes da restauração: ${ativos.join(", ")}`)
}

function listarBackups() {
  console.error("Backups disponíveis:")
  if (!fs.existsSync(BACKUP_DIR)) {
    console.error("  (nenhum backup encontrado)")
    return
  }
  const backups = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((entry) => (
      entry.name.startsWith(`${DB_PREFIX}-`) || entry.name.startsWith("pre-restore-")
    ) && (
      (entry.isDirectory() && entry.name.endsWith(BACKUP_BUNDLE_SUFFIX))
      || (entry.isFile() && entry.name.endsWith(".db"))
    ))
    .sort((a, b) => b.name.localeCompare(a.name))

  if (backups.length === 0) console.error("  (nenhum backup encontrado)")
  for (const backup of backups) {
    const tipo = backup.isDirectory() ? "completo" : "legado: só banco"
    console.error(`  ${backup.name} (${tipo})`)
  }
}

async function restaurarBancoLegado(backupPath: string) {
  validateSqlite(backupPath)
  const tempPath = path.join(path.dirname(DB_PATH), `.${path.basename(DB_PATH)}.restore-${process.pid}-${Date.now()}`)
  try {
    fs.copyFileSync(backupPath, tempPath, fs.constants.COPYFILE_EXCL)
    fs.chmodSync(tempPath, 0o600)
    validateSqlite(tempPath)
    for (const suffix of ["-wal", "-shm", "-journal"]) {
      const sidecar = `${DB_PATH}${suffix}`
      if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar)
    }
    fs.renameSync(tempPath, DB_PATH)
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
  }
}

async function main() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true, mode: 0o700 })
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true, mode: 0o700 })

  const args = process.argv.slice(2)
  const confirmouParada = args.includes("--confirm-stopped")
  const posicionais = args.filter((arg) => arg !== "--confirm-stopped")

  if (!confirmouParada || posicionais.length !== 1) {
    console.error("Uso: npm run db:restore -- --confirm-stopped <backup.backup|backup.db>")
    console.error("Antes, pare o serviço: pm2 stop escolinha")
    console.error("")
    listarBackups()
    process.exit(1)
  }

  exigirServicosParados()
  const backupFile = posicionais[0]
  const backupPath = path.isAbsolute(backupFile) ? backupFile : path.join(BACKUP_DIR, backupFile)
  if (!fs.existsSync(backupPath)) throw new Error(`Backup não encontrado: ${backupPath}`)
  if (path.resolve(backupPath) === path.resolve(DB_PATH)) throw new Error("A origem não pode ser o banco ativo")

  if (fs.existsSync(DB_PATH)) {
    const preRestorePath = await createBackupBundle({
      ...LOCATIONS,
      backupDir: BACKUP_DIR,
      prefix: "pre-restore",
    })
    console.log(`📋 Snapshot completo pré-restauração criado: ${preRestorePath}`)
  }

  const stats = fs.statSync(backupPath)
  if (stats.isDirectory() && backupPath.endsWith(BACKUP_BUNDLE_SUFFIX)) {
    restoreBackupBundle(backupPath, LOCATIONS)
    console.log(`✅ Banco, uploads e configuração restaurados de: ${backupFile}`)
  } else if (stats.isFile() && backupPath.endsWith(".db")) {
    await restaurarBancoLegado(backupPath)
    console.warn("⚠️  Backup legado restaurou somente o banco; uploads e configuração foram mantidos.")
  } else {
    throw new Error("Formato inválido: use um diretório .backup ou um arquivo legado .db")
  }

  console.log("Inicie novamente com: pm2 startOrReload deploy/ecosystem.config.cjs --only escolinha && pm2 save")
}

main().catch((error) => {
  console.error("❌ Falha ao restaurar backup:", error)
  process.exit(1)
})
