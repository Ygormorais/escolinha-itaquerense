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
import { BCRYPT_COST, isBcryptHash } from "../lib/password-hash"
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
  const usuarios = await db.usuario.findMany({ select: { username: true, senha: true } })
  const usuariosLegados = usuarios.filter((usuario) => !isBcryptHash(usuario.senha))

  if (usuariosLegados.length > 0) {
    const podeRedefinirAdmin =
      forceUpdate &&
      usuariosLegados.length === 1 &&
      usuariosLegados[0].username === username

    if (!podeRedefinirAdmin) {
      const nomes = usuariosLegados.map((usuario) => usuario.username).join(", ")
      throw new Error(
        `Deploy bloqueado: senha legada detectada para ${nomes}. ` +
        "Redefina essas senhas na instalação atual antes de importar o banco. " +
        "Se for somente o ADMIN_USERNAME, use ADMIN_SEED_FORCE_UPDATE=true por um único reinício."
      )
    }
  }

  if (existente && !forceUpdate) {
    console.log("✓ Usuário admin já existe; credenciais preservadas.")
    console.log(`  Username: ${username}`)
    return
  }

  const senhaHash = hashSync(senhaRaw, BCRYPT_COST)

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

  const adminLegado = usuariosLegados.some((usuario) => usuario.username === username)
  console.log(
    adminLegado
      ? "✓ Senha legada do admin substituída explicitamente por bcrypt."
      : existente
        ? "✓ Usuário admin atualizado explicitamente."
        : "✓ Usuário admin criado."
  )
  console.log(`  Username: ${username}`)

  const totalAdmins = await db.usuario.count({ where: { role: "admin", ativo: true } })
  console.log(`\nTotal de admins ativos: ${totalAdmins}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
