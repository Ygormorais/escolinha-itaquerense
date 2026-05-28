import { PrismaClient } from "@prisma/client"
import type { Prisma } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db")
  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  const options: Prisma.PrismaClientOptions = {
    adapter,
    log: ["error"],
  }
  return new PrismaClient(options)
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient()
}

export const db = globalForPrisma.prisma
