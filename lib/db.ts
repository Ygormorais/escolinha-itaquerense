import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { resolveDbPath } from "@/lib/db-path"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: resolveDbPath() })
  return new PrismaClient({ adapter, log: ["error"] })
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient()
}

export const db = globalForPrisma.prisma
