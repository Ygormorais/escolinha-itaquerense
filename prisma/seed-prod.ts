/**
 * Seed de produção — cria somente o usuário admin inicial.
 * Seguro para rodar em produção: não apaga nada, usa upsert.
 *
 * Uso:
 *   SENHA_ADMIN=minhasenha npx tsx prisma/seed-prod.ts
 *
 * Se SENHA_ADMIN não for definida, usa "escolinha123" como fallback
 * (mude imediatamente após o primeiro login).
 */

import { PrismaClient } from "@prisma/client"
import { hashSync } from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const senhaRaw = process.env.SENHA_ADMIN ?? "escolinha123"
  const senhaHash = hashSync(senhaRaw, 12)

  const admin = await db.usuario.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      nome: "Administrador",
      senha: senhaHash,
      role: "admin",
      ativo: true,
    },
  })

  const jaExistia = admin.createdAt < new Date(Date.now() - 5000)

  if (jaExistia) {
    console.log("✓ Usuário admin já existia — nenhuma alteração.")
  } else {
    console.log("✓ Usuário admin criado.")
    console.log(`  Username : admin`)
    console.log(`  Senha    : ${senhaRaw}`)
    console.log("")
    if (senhaRaw === "escolinha123") {
      console.log("⚠️  ATENÇÃO: troque a senha após o primeiro login!")
    }
  }

  // Verifica se há outros admins além do recém-criado
  const totalAdmins = await db.usuario.count({ where: { role: "admin", ativo: true } })
  console.log(`\nTotal de admins ativos: ${totalAdmins}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
