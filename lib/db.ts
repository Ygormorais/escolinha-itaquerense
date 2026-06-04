import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import path from "path"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient(): PrismaClient {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db")
  const adapter = new PrismaBetterSqlite3({ url: dbPath })
  return new PrismaClient({ adapter, log: ["error"] })
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

// Inicializacao preguicosa: o PrismaClient (better-sqlite3, handle nativo) so e
// criado no primeiro acesso. Evita abrir o handle no import durante os testes
// (que mockam o db ou usam client proprio), o que mantinha o `vitest run`
// pendurado no CI sem nunca encerrar o processo. Ver issue #40.
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma()
    const value = Reflect.get(client as object, prop, receiver)
    return typeof value === "function" ? value.bind(client) : value
  },
})
