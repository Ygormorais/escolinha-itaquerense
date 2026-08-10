/**
 * Seed de produção — cria somente o usuário admin inicial.
 * Seguro para rodar em produção: não apaga dados e não redefine a senha de um
 * admin existente, salvo quando ADMIN_SEED_FORCE_UPDATE=true for explícito.
 *
 * Uso:
 *   npm run db:seed-prod
 *
 * ADMIN_USERNAME e ADMIN_PASSWORD são carregados do .env e são obrigatórios.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { hashSync } from "bcryptjs"
import { resolveDbPath } from "../lib/db-path"
import { loadEnv } from "../scripts/load-env"

loadEnv()

const db = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: resolveDbPath() }),
})

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim()
  const senhaRaw = process.env.ADMIN_PASSWORD?.trim()
  if (!username) throw new Error("ADMIN_USERNAME não definido no .env")
  if (!senhaRaw) throw new Error("ADMIN_PASSWORD não definido no .env")
  if (senhaRaw.length < 12 || senhaRaw === "escolinha123") {
    throw new Error("ADMIN_PASSWORD deve ter ao menos 12 caracteres e não pode usar a senha padrão")
  }

  const existente = await db.usuario.findUnique({ where: { username } })
  const forceUpdate = process.env.ADMIN_SEED_FORCE_UPDATE === "true"

  if (existente && !forceUpdate) {
    console.log("✓ Usuário admin já existe; credenciais preservadas.")
    console.log(`  Username: ${username}`)
    return
  }

  const senhaHash = hashSync(senhaRaw, 12)

  await db.usuario.upsert({
    where: { username },
    update: {
      nome: "Administrador",
      senha: senhaHash,
      role: "admin",
      ativo: true,
    },
    create: {
      username,
      nome: "Administrador",
      senha: senhaHash,
      role: "admin",
      ativo: true,
    },
  })

  console.log(existente ? "✓ Usuário admin atualizado explicitamente." : "✓ Usuário admin criado.")
  console.log(`  Username: ${username}`)

  const totalAdmins = await db.usuario.count({ where: { role: "admin", ativo: true } })
  console.log(`\nTotal de admins ativos: ${totalAdmins}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
