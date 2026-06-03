import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

async function main() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db")
  console.log("DB path:", dbPath)
  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  const db = new PrismaClient({ adapter, log: ["error", "info", "warn", "query"] })
  
  try {
    const users = await db.usuario.findMany()
    console.log("Users:", JSON.stringify(users, null, 2))
  } catch (e) {
    console.error("Error:", e)
  }
  await db.$disconnect()
}
main()
