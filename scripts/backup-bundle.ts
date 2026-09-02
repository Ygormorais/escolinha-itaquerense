import crypto from "crypto"
import fs from "fs"
import path from "path"
import Database from "better-sqlite3"

export const BACKUP_BUNDLE_SUFFIX = ".backup"
const MANIFEST_VERSION = 1

type ManifestFile = { path: string; size: number; sha256: string }
export type BackupManifest = {
  version: typeof MANIFEST_VERSION
  createdAt: string
  files: ManifestFile[]
}

export type BackupLocations = {
  dbPath: string
  uploadsDir: string
  configPath: string
}

function modeFile(file: string) {
  fs.chmodSync(file, 0o600)
}

function modeDir(dir: string) {
  fs.chmodSync(dir, 0o700)
}

function sha256(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex")
}

function walkFiles(root: string, current = root): string[] {
  if (!fs.existsSync(current)) return []
  const files: string[] = []
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Link simbólico não permitido no backup: ${full}`)
    if (entry.isDirectory()) files.push(...walkFiles(root, full))
    else if (entry.isFile()) files.push(path.relative(root, full).replaceAll(path.sep, "/"))
  }
  return files.sort()
}

function copyTreeSecure(source: string, destination: string) {
  fs.mkdirSync(destination, { recursive: true, mode: 0o700 })
  modeDir(destination)
  if (!fs.existsSync(source)) return
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name)
    const to = path.join(destination, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Link simbólico não permitido no backup: ${from}`)
    if (entry.isDirectory()) copyTreeSecure(from, to)
    else if (entry.isFile()) {
      fs.copyFileSync(from, to, fs.constants.COPYFILE_EXCL)
      modeFile(to)
    }
  }
}

export function validateSqlite(file: string) {
  const db = new Database(file, { readonly: true, fileMustExist: true })
  try {
    const result = db.pragma("quick_check", { simple: true })
    if (result !== "ok") throw new Error(`PRAGMA quick_check retornou: ${String(result)}`)
  } finally {
    db.close()
  }
}

async function backupSqlite(source: string, destination: string) {
  const db = new Database(source, { readonly: true, fileMustExist: true })
  try {
    await db.backup(destination)
  } finally {
    db.close()
  }
  modeFile(destination)
  validateSqlite(destination)
}

function createManifest(bundleDir: string, createdAt: string): BackupManifest {
  const files = walkFiles(bundleDir)
    .filter((relative) => relative !== "manifest.json")
    .map((relative) => {
      const absolute = path.join(bundleDir, ...relative.split("/"))
      return { path: relative, size: fs.statSync(absolute).size, sha256: sha256(absolute) }
    })
  return { version: MANIFEST_VERSION, createdAt, files }
}

export function validateBackupBundle(bundleDir: string): BackupManifest {
  const resolvedBundle = path.resolve(bundleDir)
  if (!fs.statSync(resolvedBundle).isDirectory()) throw new Error("O backup completo deve ser um diretório")
  const manifestPath = path.join(resolvedBundle, "manifest.json")
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as BackupManifest
  if (manifest.version !== MANIFEST_VERSION || !Array.isArray(manifest.files)) {
    throw new Error("Manifesto de backup incompatível")
  }

  const declared = new Set<string>()
  for (const entry of manifest.files) {
    const segments = entry.path?.split("/") ?? []
    if (
      !entry.path
      || path.isAbsolute(entry.path)
      || entry.path.includes("\\")
      || segments.some((segment) => !segment || segment === "." || segment === "..")
    ) {
      throw new Error(`Caminho inválido no manifesto: ${entry.path}`)
    }
    if (declared.has(entry.path)) throw new Error(`Arquivo duplicado no manifesto: ${entry.path}`)
    declared.add(entry.path)
    const absolute = path.resolve(resolvedBundle, ...entry.path.split("/"))
    if (!absolute.startsWith(`${resolvedBundle}${path.sep}`) || !fs.statSync(absolute).isFile()) {
      throw new Error(`Arquivo do manifesto ausente: ${entry.path}`)
    }
    const stats = fs.statSync(absolute)
    if (stats.size !== entry.size || sha256(absolute) !== entry.sha256) {
      throw new Error(`Integridade divergente: ${entry.path}`)
    }
  }

  const actual = walkFiles(resolvedBundle).filter((relative) => relative !== "manifest.json")
  if (actual.some((relative) => !declared.has(relative))) throw new Error("Backup contém arquivo não declarado")
  if (!declared.has("database.db")) throw new Error("Backup não contém database.db")
  validateSqlite(path.join(resolvedBundle, "database.db"))
  return manifest
}

export function findLatestBackupBundle(backupDir: string): string {
  const resolvedDir = path.resolve(backupDir)
  if (!fs.existsSync(resolvedDir) || !fs.statSync(resolvedDir).isDirectory()) {
    throw new Error(`Diretório de backups não encontrado: ${resolvedDir}`)
  }

  const bundles = fs.readdirSync(resolvedDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(BACKUP_BUNDLE_SUFFIX))
    .map((entry) => {
      const absolute = path.join(resolvedDir, entry.name)
      return { absolute, modifiedAt: fs.statSync(absolute).mtimeMs }
    })
    .sort((a, b) => b.modifiedAt - a.modifiedAt)

  if (bundles.length === 0) throw new Error(`Nenhum backup completo encontrado em: ${resolvedDir}`)
  return bundles[0].absolute
}

export async function createBackupBundle(options: BackupLocations & {
  backupDir: string
  prefix: string
  now?: Date
}): Promise<string> {
  const now = options.now ?? new Date()
  const timestamp = now.toISOString().replace(/[:.]/g, "-")
  const name = `${options.prefix}-${timestamp}${BACKUP_BUNDLE_SUFFIX}`
  const finalDir = path.join(options.backupDir, name)
  const tempDir = path.join(options.backupDir, `.tmp-${name}-${process.pid}`)
  if (fs.existsSync(finalDir)) throw new Error(`Backup já existe: ${finalDir}`)

  fs.mkdirSync(options.backupDir, { recursive: true, mode: 0o700 })
  modeDir(options.backupDir)
  fs.mkdirSync(tempDir, { mode: 0o700 })
  try {
    await backupSqlite(options.dbPath, path.join(tempDir, "database.db"))
    copyTreeSecure(options.uploadsDir, path.join(tempDir, "uploads"))
    if (fs.existsSync(options.configPath)) {
      const configDestination = path.join(tempDir, "config", "club.config.json")
      fs.mkdirSync(path.dirname(configDestination), { recursive: true, mode: 0o700 })
      fs.copyFileSync(options.configPath, configDestination, fs.constants.COPYFILE_EXCL)
      modeFile(configDestination)
    }

    const manifest = createManifest(tempDir, now.toISOString())
    const manifestPath = path.join(tempDir, "manifest.json")
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 })
    modeFile(manifestPath)
    validateBackupBundle(tempDir)
    fs.renameSync(tempDir, finalDir)
    return finalDir
  } finally {
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function removePath(target: string) {
  if (!fs.existsSync(target)) return
  const stats = fs.lstatSync(target)
  if (stats.isDirectory()) fs.rmSync(target, { recursive: true, force: true })
  else fs.unlinkSync(target)
}

function stageTree(source: string, target: string) {
  removePath(target)
  copyTreeSecure(source, target)
}

/** Restaura um bundle já validado. O chamador deve garantir que o app está parado. */
export function restoreBackupBundle(bundleDir: string, locations: BackupLocations) {
  validateBackupBundle(bundleDir)
  const id = `${process.pid}-${Date.now()}`
  const stagedDb = path.join(path.dirname(locations.dbPath), `.${path.basename(locations.dbPath)}.stage-${id}`)
  const rollbackDb = path.join(path.dirname(locations.dbPath), `.${path.basename(locations.dbPath)}.rollback-${id}`)
  const stagedUploads = path.join(path.dirname(locations.uploadsDir), `.${path.basename(locations.uploadsDir)}.stage-${id}`)
  const rollbackUploads = path.join(path.dirname(locations.uploadsDir), `.${path.basename(locations.uploadsDir)}.rollback-${id}`)
  const stagedConfig = path.join(path.dirname(locations.configPath), `.${path.basename(locations.configPath)}.stage-${id}`)
  const rollbackConfig = path.join(path.dirname(locations.configPath), `.${path.basename(locations.configPath)}.rollback-${id}`)
  const bundleConfig = path.join(bundleDir, "config", "club.config.json")

  for (const parent of [path.dirname(locations.dbPath), path.dirname(locations.uploadsDir), path.dirname(locations.configPath)]) {
    fs.mkdirSync(parent, { recursive: true, mode: 0o700 })
  }

  fs.copyFileSync(path.join(bundleDir, "database.db"), stagedDb, fs.constants.COPYFILE_EXCL)
  modeFile(stagedDb)
  validateSqlite(stagedDb)
  stageTree(path.join(bundleDir, "uploads"), stagedUploads)
  if (fs.existsSync(bundleConfig)) {
    fs.copyFileSync(bundleConfig, stagedConfig, fs.constants.COPYFILE_EXCL)
    modeFile(stagedConfig)
  }

  const hadDb = fs.existsSync(locations.dbPath)
  const hadUploads = fs.existsSync(locations.uploadsDir)
  const hadConfig = fs.existsSync(locations.configPath)
  let touchedDb = false
  let touchedUploads = false
  let touchedConfig = false

  try {
    for (const suffix of ["-wal", "-shm", "-journal"]) removePath(`${locations.dbPath}${suffix}`)
    touchedUploads = true
    if (hadUploads) fs.renameSync(locations.uploadsDir, rollbackUploads)
    fs.renameSync(stagedUploads, locations.uploadsDir)

    touchedConfig = true
    if (hadConfig) fs.renameSync(locations.configPath, rollbackConfig)
    if (fs.existsSync(stagedConfig)) fs.renameSync(stagedConfig, locations.configPath)

    touchedDb = true
    if (hadDb) fs.renameSync(locations.dbPath, rollbackDb)
    fs.renameSync(stagedDb, locations.dbPath)
    validateSqlite(locations.dbPath)
  } catch (error) {
    if (touchedDb) removePath(locations.dbPath)
    if (hadDb && fs.existsSync(rollbackDb)) fs.renameSync(rollbackDb, locations.dbPath)
    if (touchedConfig) removePath(locations.configPath)
    if (hadConfig && fs.existsSync(rollbackConfig)) fs.renameSync(rollbackConfig, locations.configPath)
    if (touchedUploads) removePath(locations.uploadsDir)
    if (hadUploads && fs.existsSync(rollbackUploads)) fs.renameSync(rollbackUploads, locations.uploadsDir)
    throw error
  } finally {
    for (const target of [stagedDb, stagedUploads, stagedConfig]) removePath(target)
  }

  for (const target of [rollbackDb, rollbackUploads, rollbackConfig]) removePath(target)
}
