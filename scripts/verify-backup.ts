import path from "path"
import { BACKUP_BUNDLE_SUFFIX, findLatestBackupBundle, validateBackupBundle } from "./backup-bundle"
import { loadEnv } from "./load-env"

loadEnv()

function resolveBundle(): string {
  const requested = process.argv[2]
  if (requested) {
    const absolute = path.resolve(requested)
    if (!absolute.endsWith(BACKUP_BUNDLE_SUFFIX)) {
      throw new Error("Informe um diretório de backup completo com extensão .backup")
    }
    return absolute
  }

  const backupDir = process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups")
  return findLatestBackupBundle(backupDir)
}

try {
  const bundle = resolveBundle()
  const manifest = validateBackupBundle(bundle)
  const totalBytes = manifest.files.reduce((total, file) => total + file.size, 0)
  console.log(`✅ Backup íntegro: ${bundle}`)
  console.log(`   Criado em: ${manifest.createdAt}`)
  console.log(`   Arquivos: ${manifest.files.length}`)
  console.log(`   Tamanho verificado: ${totalBytes} bytes`)
} catch (error) {
  console.error("❌ Backup inválido:", error instanceof Error ? error.message : error)
  process.exit(1)
}
