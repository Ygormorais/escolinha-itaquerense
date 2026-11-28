/**
 * Ensaio de restauração: prova, num ambiente descartável, que o backup completo volta inteiro.
 *
 *  1. cria um banco novo com TODAS as migrations reais (prisma migrate deploy);
 *  2. grava dados de verdade (responsável, aluno), um upload e a configuração do clube;
 *  3. gera o backup completo e valida o manifesto;
 *  4. estraga tudo (apaga dados, upload e config);
 *  5. restaura e confere: integridade do SQLite, mesmas tabelas, mesmos dados, mesmo upload e config.
 *
 * Não toca no banco, nos uploads nem na configuração reais. Uso: npm run db:backup:drill
 */
import fs from "fs"
import os from "os"
import path from "path"
import { spawnSync } from "child_process"
import Database from "better-sqlite3"
import { createBackupBundle, restoreBackupBundle, validateBackupBundle } from "./backup-bundle"

const raiz = fs.mkdtempSync(path.join(os.tmpdir(), "escolinha-ensaio-restauracao-"))
const dbPath = path.join(raiz, "dados", "ensaio.db")
const uploadsDir = path.join(raiz, "dados", "uploads")
const configPath = path.join(raiz, "dados", "config", "club.config.json")
const backupDir = path.join(raiz, "backups")

function falhar(mensagem: string): never {
  throw new Error(mensagem)
}

function conferir(condicao: boolean, mensagem: string) {
  if (!condicao) falhar(mensagem)
  console.log(`   ✓ ${mensagem}`)
}

function tabelas(file: string): string[] {
  const db = new Database(file, { readonly: true })
  try {
    return (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[]).map((t) => t.name)
  } finally {
    db.close()
  }
}

async function main() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  console.log(`Ambiente descartável: ${raiz}`)

  console.log("1. Criando banco com as migrations reais…")
  const migrate = spawnSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
    encoding: "utf8",
    shell: true,
  })
  if (migrate.status !== 0) falhar(`prisma migrate deploy falhou:\n${migrate.stdout}\n${migrate.stderr}`)
  const migrationsNoDisco = fs.readdirSync(path.join(process.cwd(), "prisma", "migrations"), { withFileTypes: true }).filter((e) => e.isDirectory()).length

  console.log("2. Gravando dados, upload e configuração…")
  const db = new Database(dbPath)
  db.prepare("INSERT INTO Responsavel (nome, email, telefone, senha) VALUES (?, ?, ?, ?)").run("Família Ensaio", "ensaio@example.com", "11999990000", "hash-ensaio")
  const migrationsAplicadas = (db.prepare("SELECT COUNT(*) AS n FROM _prisma_migrations").get() as { n: number }).n
  const antes = tabelas(dbPath)
  db.close()
  fs.mkdirSync(path.join(uploadsDir, "matriculas"), { recursive: true })
  fs.writeFileSync(path.join(uploadsDir, "matriculas", "documento.pdf"), "documento do ensaio")
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  fs.writeFileSync(configPath, JSON.stringify({ nome: "Clube do ensaio" }))
  conferir(migrationsAplicadas === migrationsNoDisco, `todas as ${migrationsNoDisco} migrations aplicadas`)

  console.log("3. Gerando e validando o backup completo…")
  const locais = { dbPath, uploadsDir, configPath }
  const bundle = await createBackupBundle({ ...locais, backupDir, prefix: "ensaio" })
  const manifesto = validateBackupBundle(bundle)
  conferir(manifesto.files.some((f) => f.path === "database.db"), "manifesto inclui o banco")
  conferir(manifesto.files.some((f) => f.path.startsWith("uploads/")), "manifesto inclui os uploads")
  conferir(manifesto.files.some((f) => f.path.startsWith("config/")), "manifesto inclui a configuração")

  console.log("4. Estragando o ambiente…")
  const sujo = new Database(dbPath)
  sujo.prepare("DELETE FROM Responsavel").run()
  sujo.close()
  fs.rmSync(uploadsDir, { recursive: true, force: true })
  fs.writeFileSync(configPath, JSON.stringify({ nome: "Estragado" }))

  console.log("5. Restaurando e conferindo…")
  restoreBackupBundle(bundle, locais)
  const depois = new Database(dbPath, { readonly: true })
  try {
    conferir((depois.pragma("integrity_check") as { integrity_check: string }[])[0].integrity_check === "ok", "integrity_check do SQLite: ok")
    const linha = depois.prepare("SELECT nome, email FROM Responsavel").get() as { nome: string; email: string } | undefined
    conferir(linha?.email === "ensaio@example.com", "dados do responsável voltaram")
    const migrations = (depois.prepare("SELECT COUNT(*) AS n FROM _prisma_migrations").get() as { n: number }).n
    conferir(migrations === migrationsNoDisco, "histórico de migrations preservado")
  } finally {
    depois.close()
  }
  conferir(JSON.stringify(tabelas(dbPath)) === JSON.stringify(antes), `as mesmas ${antes.length} tabelas`)
  conferir(fs.readFileSync(path.join(uploadsDir, "matriculas", "documento.pdf"), "utf8") === "documento do ensaio", "upload voltou")
  conferir(JSON.parse(fs.readFileSync(configPath, "utf8")).nome === "Clube do ensaio", "configuração voltou")
  console.log("\n✅ Ensaio de restauração concluído: o backup restaura banco, uploads e configuração.")
}

main()
  .catch((erro) => {
    console.error("\n❌ Ensaio de restauração falhou:", erro instanceof Error ? erro.message : erro)
    process.exitCode = 1
  })
  .finally(() => {
    try {
      fs.rmSync(raiz, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    } catch {
      console.warn(`(não consegui apagar ${raiz}; pode remover à mão)`)
    }
  })
