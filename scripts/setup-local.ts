/**
 * Setup local do zero: cria o .env, aplica as migrations e popula o banco.
 *
 *   npm run setup
 *
 * Seguro para rodar de novo: não sobrescreve .env existente e só roda o seed
 * quando o banco acabou de ser criado (o seed apaga os dados de teste atuais).
 */
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { resolveDbPath } from "../lib/db-path"
import { loadEnv } from "./load-env"

const cwd = process.cwd()
const run = (cmd: string) => execSync(cmd, { stdio: "inherit", cwd })

const envFile = path.join(cwd, ".env")
const envLocalFile = path.join(cwd, ".env.local")
if (!fs.existsSync(envFile) && !fs.existsSync(envLocalFile)) {
  fs.copyFileSync(path.join(cwd, ".env.example"), envFile)
  console.log("✅ .env criado a partir de .env.example")
}

const fromShell = process.env.DATABASE_URL
loadEnv(cwd)

if (process.env.NODE_ENV === "production") {
  console.error("❌ npm run setup é só para desenvolvimento. Use DEPLOY.md em produção.")
  process.exit(1)
}

if (fromShell) {
  console.warn(
    `⚠️  DATABASE_URL veio do terminal (${fromShell}) e tem prioridade sobre o .env.\n` +
      "   Se não for intencional, rode `unset DATABASE_URL` (ou feche o terminal) e tente de novo.",
  )
}

const dbPath = resolveDbPath()
const novo = !fs.existsSync(dbPath)
console.log(`📦 Banco SQLite: ${dbPath}${novo ? " (novo)" : ""}`)

run("npx prisma migrate deploy")

if (novo) {
  run("npx tsx prisma/seed.ts")
} else {
  console.log("ℹ️  Banco já existia; seed pulado. Para recriar os dados de teste: npm run db:seed")
}

console.log("\n🎉 Pronto. Rode `npm run dev` e acesse http://localhost:3000")
