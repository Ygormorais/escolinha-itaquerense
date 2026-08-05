import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"
import Database from "better-sqlite3"
import { resolveDbPath } from "../lib/db-path"
import { loadEnv } from "./load-env"

loadEnv()

const DB_PATH = resolveDbPath()
const DB_PREFIX = path.basename(DB_PATH, ".db")
const BACKUP_DIR = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups")
const REQUIRED_PM2_SERVICES = new Set(["escolinha", "escolinha-fpfs"])

function validarSqlite(file: string) {
  const db = new Database(file, { readonly: true, fileMustExist: true })
  try {
    const resultado = db.pragma("quick_check", { simple: true })
    if (resultado !== "ok") {
      throw new Error(`PRAGMA quick_check retornou: ${String(resultado)}`)
    }
  } finally {
    db.close()
  }
}

function exigirServicosParados() {
  const result = spawnSync("pm2", ["jlist"], { encoding: "utf8" })
  const code = (result.error as NodeJS.ErrnoException | undefined)?.code
  if (code === "ENOENT") return
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Não foi possível consultar o PM2: ${result.stderr.trim()}`)

  const apps = JSON.parse(result.stdout) as Array<{
    name?: string
    pm2_env?: { status?: string }
  }>
  const ativos = apps
    .filter((app) => app.name && REQUIRED_PM2_SERVICES.has(app.name))
    .filter((app) => app.pm2_env?.status !== "stopped")
    .map((app) => `${app.name} (${app.pm2_env?.status ?? "status desconhecido"})`)

  if (ativos.length > 0) {
    throw new Error(`Pare os processos antes da restauração: ${ativos.join(", ")}`)
  }
}

function listarBackups() {
  console.error("Backups disponíveis:")
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter((file) => file.startsWith(`${DB_PREFIX}-`) && file.endsWith(".db"))
    .sort()
    .reverse()

  if (backups.length === 0) {
    console.error("  (nenhum backup encontrado)")
    return
  }

  for (const backup of backups) {
    const stats = fs.statSync(path.join(BACKUP_DIR, backup))
    console.error(`  ${backup} (${(stats.size / 1024).toFixed(1)} KB)`)
  }
}

async function criarSnapshotAtual(destino: string) {
  const atual = new Database(DB_PATH, { readonly: true, fileMustExist: true })
  try {
    await atual.backup(destino)
  } finally {
    atual.close()
  }
  validarSqlite(destino)
  fs.chmodSync(destino, 0o600)
}

async function main() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

  const args = process.argv.slice(2)
  const confirmouParada = args.includes("--confirm-stopped")
  const posicionais = args.filter((arg) => arg !== "--confirm-stopped")

  if (!confirmouParada || posicionais.length !== 1) {
    console.error("Uso: npm run db:restore -- --confirm-stopped <arquivo-backup>")
    console.error("Antes, pare os dois processos: pm2 stop escolinha escolinha-fpfs")
    console.error("")
    listarBackups()
    process.exit(1)
  }

  exigirServicosParados()

  const backupFile = posicionais[0]
  const backupPath = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(BACKUP_DIR, backupFile)

  if (!fs.existsSync(backupPath) || !fs.statSync(backupPath).isFile()) {
    throw new Error(`Backup não encontrado: ${backupPath}`)
  }
  if (path.resolve(backupPath) === path.resolve(DB_PATH)) {
    throw new Error("O arquivo de origem não pode ser o próprio banco ativo")
  }

  validarSqlite(backupPath)

  if (fs.existsSync(DB_PATH)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
    const preRestorePath = path.join(BACKUP_DIR, `pre-restore-${timestamp}.db`)
    await criarSnapshotAtual(preRestorePath)
    console.log(`📋 Snapshot pré-restauração criado: ${preRestorePath}`)
  }

  const tempPath = path.join(
    path.dirname(DB_PATH),
    `.${path.basename(DB_PATH)}.restore-${process.pid}-${Date.now()}`
  )

  try {
    fs.copyFileSync(backupPath, tempPath, fs.constants.COPYFILE_EXCL)
    fs.chmodSync(tempPath, 0o600)
    validarSqlite(tempPath)
    for (const suffix of ["-wal", "-shm", "-journal"]) {
      const sidecar = `${DB_PATH}${suffix}`
      if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar)
    }
    fs.renameSync(tempPath, DB_PATH)
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
  }

  const sizeKB = (fs.statSync(DB_PATH).size / 1024).toFixed(1)
  console.log(`✅ Banco restaurado de: ${backupFile} (${sizeKB} KB)`)
  console.log("Inicie novamente com: pm2 startOrReload deploy/ecosystem.config.cjs && pm2 save")
}

main().catch((error) => {
  console.error("❌ Falha ao restaurar backup:", error)
  process.exit(1)
})
