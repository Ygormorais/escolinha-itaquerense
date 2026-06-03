import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

async function main() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db")
  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  const db = new PrismaClient({ adapter })
  
  const hash = bcrypt.hashSync("escolinha123", 10)
  await db.usuario.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", nome: "Administrador", senha: hash, role: "admin" },
  })
  console.log("User created: admin / escolinha123")
  await db.$disconnect()
}
main()
