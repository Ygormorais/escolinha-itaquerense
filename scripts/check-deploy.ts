/**
 * Pré-deploy check — rode antes de subir a aplicação em produção.
 * Usage: npx tsx scripts/check-deploy.ts
 */

import { execSync } from "child_process"
import * as fs from "fs"
import * as path from "path"
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

const RED   = "\x1b[31m"
const GREEN = "\x1b[32m"
const YELLOW = "\x1b[33m"
const RESET = "\x1b[0m"

let failures = 0
let warnings = 0

function ok(label: string)  { console.log(`${GREEN}✓${RESET}  ${label}`) }
function fail(label: string) { console.log(`${RED}✗${RESET}  ${label}`); failures++ }
function warn(label: string) { console.log(`${YELLOW}⚠${RESET}  ${label}`); warnings++ }
function section(title: string) { console.log(`\n${title}`) }

// ── Variáveis obrigatórias ────────────────────────────────────────────────────

section("── Variáveis de ambiente (obrigatórias) ──")

const REQUIRED: { key: string; hint?: string }[] = [
  { key: "DATABASE_URL",    hint: "ex: file:/app/prisma/prod.db" },
  { key: "SESSION_SECRET",  hint: "min 32 chars — node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"" },
  { key: "CRON_SECRET",     hint: "token Bearer para /api/cron/lembretes" },
  { key: "ADMIN_USERNAME",  hint: "nome de login do admin padrão" },
  { key: "ADMIN_PASSWORD",  hint: "senha do admin padrão" },
  { key: "NEXT_PUBLIC_APP_URL", hint: "URL pública do app — ex: https://escolinha.com.br" },
]

for (const { key, hint } of REQUIRED) {
  const val = process.env[key]
  if (!val) {
    fail(`${key} não definida${hint ? ` — ${hint}` : ""}`)
  } else if (val.includes("mude-esta") || val.includes("troque-para") || val.includes("sua-")) {
    fail(`${key} ainda tem valor de placeholder — troque antes de fazer deploy`)
  } else {
    ok(key)
  }
}

// ── Variáveis opcionais com impacto funcional ─────────────────────────────────

section("── Variáveis opcionais (funcionalidades) ──")

const OPTIONAL: { key: string; feature: string }[] = [
  { key: "MERCADOPAGO_ACCESS_TOKEN",   feature: "PIX/Boleto (Mercado Pago)" },
  { key: "MERCADOPAGO_WEBHOOK_SECRET", feature: "validação de webhook MP" },
  { key: "EVOLUTION_API_KEY",          feature: "WhatsApp (Evolution API)" },
  { key: "SMTP_HOST",                  feature: "e-mail (lembretes inadimplência)" },
  { key: "ANTHROPIC_API_KEY",          feature: "chatbot WhatsApp (Claude)" },
  { key: "VAPID_PUBLIC_KEY",           feature: "push notifications (PWA)" },
  { key: "VAPID_PRIVATE_KEY",          feature: "push notifications (PWA)" },
  { key: "GOOGLE_SERVICE_ACCOUNT_EMAIL", feature: "sincronização Google Calendar" },
]

for (const { key, feature } of OPTIONAL) {
  const val = process.env[key]
  if (!val || val.includes("sua-") || val.includes("seu-")) {
    warn(`${key} ausente — desabilita: ${feature}`)
  } else {
    ok(`${key} (${feature})`)
  }
}

// ── SESSION_SECRET tem entropia suficiente? ────────────────────────────────────

section("── Segurança ──")

const secret = process.env.SESSION_SECRET ?? ""
if (secret.length < 32) {
  fail(`SESSION_SECRET muito curta (${secret.length} chars) — use mínimo 32`)
} else {
  ok(`SESSION_SECRET com ${secret.length} chars`)
}

// ── Banco de dados acessível? ──────────────────────────────────────────────────

section("── Banco de dados ──")

const dbUrl = process.env.DATABASE_URL ?? ""
if (dbUrl.startsWith("file:")) {
  const dbPath = dbUrl.replace("file:", "")
  const absPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath)
  if (fs.existsSync(absPath)) {
    ok(`Arquivo de banco encontrado: ${absPath}`)
  } else {
    fail(`Banco não encontrado em: ${absPath} — rode 'npx prisma migrate deploy' primeiro`)
  }
}

// ── Migrações pendentes? ───────────────────────────────────────────────────────

try {
  const output = execSync("npx prisma migrate status 2>&1", {
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  })
  if (output.includes("Database schema is up to date")) {
    ok("Migrações: banco atualizado")
  } else if (output.includes("following migration(s) have not yet been applied")) {
    fail("Migrações pendentes — rode 'npx prisma migrate deploy' antes de iniciar")
  } else {
    warn("Não foi possível verificar status de migrações — confirme manualmente")
  }
} catch {
  warn("prisma migrate status falhou — confirme migrações manualmente")
}

// ── Diretório de uploads ───────────────────────────────────────────────────────

section("── Sistema de arquivos ──")

const uploadsDir = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public", "uploads")
if (fs.existsSync(uploadsDir)) {
  ok(`Diretório de uploads: ${uploadsDir}`)
} else {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true })
    ok(`Diretório de uploads criado: ${uploadsDir}`)
  } catch {
    fail(`Não foi possível criar diretório de uploads: ${uploadsDir}`)
  }
}

// ── Build existe? ──────────────────────────────────────────────────────────────

section("── Build ──")

if (fs.existsSync(path.join(process.cwd(), ".next", "BUILD_ID"))) {
  ok("Build Next.js encontrado (.next/BUILD_ID)")
} else {
  fail("Build não encontrado — rode 'npm run build' antes de iniciar")
}

// ── Resultado ─────────────────────────────────────────────────────────────────

console.log("")
console.log("─".repeat(50))

if (failures > 0) {
  console.log(`${RED}FALHOU${RESET}: ${failures} erro(s), ${warnings} aviso(s)`)
  console.log("Corrija os erros acima antes de subir em produção.\n")
  process.exit(1)
} else if (warnings > 0) {
  console.log(`${YELLOW}OK COM AVISOS${RESET}: 0 erros, ${warnings} aviso(s)`)
  console.log("Funcionalidades opcionais desabilitadas. Pode subir com cautela.\n")
  process.exit(0)
} else {
  console.log(`${GREEN}TUDO OK${RESET}: pronto para produção.\n`)
  process.exit(0)
}
