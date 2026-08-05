import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { readFileSync, readdirSync, rmSync } from "fs"
import path from "path"
import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import Database from "better-sqlite3"

/**
 * Teste de integração: roda o db.pagamento.update REAL contra o schema do banco,
 * usando os mesmos campos que a action grava ao emitir uma cobrança.
 *
 * Os testes unitários de cobranca.test.ts mockam o db, então um descompasso
 * entre o objeto `data` da action e o schema do Prisma (campo inexistente,
 * client desatualizado) passa despercebido. Este teste pega exatamente isso.
 */
const testDb = path.join(process.cwd(), "prisma", "test-cobranca.db")
const migrationsDir = path.join(process.cwd(), "prisma", "migrations")

let db: PrismaClient

function applyMigrations(databasePath: string) {
  const sqlite = new Database(databasePath)
  try {
    const migrations = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()

    for (const migration of migrations) {
      const sql = readFileSync(path.join(migrationsDir, migration, "migration.sql"), "utf8")
      sqlite.exec(sql)
    }
  } finally {
    sqlite.close()
  }
}

describe("emitirCobranca — integração update", () => {
  beforeAll(async () => {
    rmSync(testDb, { force: true })
    applyMigrations(testDb)

    db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: testDb }) })

    const aluno = await db.aluno.create({
      data: {
        nome: "Aluno Integração Cobrança",
        dataNascimento: new Date("2015-01-15T12:00:00.000Z"),
        turma: "Teste",
        horario: "Seg/Qua 08h",
        responsavel: "Responsável Integração",
        telefone: "11999999999",
        email: "cobranca-integracao@escolinha.test",
        dataMatricula: new Date("2026-01-01T12:00:00.000Z"),
        mensalidade: 150,
      },
    })

    await db.pagamento.create({
      data: {
        alunoId: aluno.id,
        mesReferencia: "2026-01",
        dataVencimento: new Date("2026-01-10T12:00:00.000Z"),
      },
    })
  })

  afterAll(async () => {
    await db?.$disconnect()
    rmSync(testDb, { force: true })
  })

  it("grava todos os campos de cobrança que a action escreve", async () => {
    const pagamento = await db.pagamento.findFirst()
    expect(pagamento, "fixture deve criar ao menos um pagamento").toBeTruthy()

    // Mesmo shape escrito por app/actions/cobranca.ts ao emitir um boleto.
    const data = {
      canalPrevisto: "Boleto",
      statusCobranca: "pendente",
      externalId: "mp-integration-test",
      externalUrl: "https://exemplo/boleto",
      linhaDigitavel: "23793380296060088434450006333301714710000015000",
      pixCopiaECola: null as string | null,
    }

    const atualizado = await db.pagamento.update({
      where: { id: pagamento!.id },
      data,
    })

    expect(atualizado.canalPrevisto).toBe("Boleto")
    expect(atualizado.statusCobranca).toBe("pendente")
    expect(atualizado.externalId).toBe("mp-integration-test")
    expect(atualizado.linhaDigitavel).toBe(data.linhaDigitavel)
    expect(atualizado.externalUrl).toBe(data.externalUrl)
  })
})
