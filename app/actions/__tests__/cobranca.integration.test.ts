import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { copyFileSync, existsSync, rmSync } from "fs"
import path from "path"
import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

/**
 * Teste de integração: roda o db.pagamento.update REAL contra o schema do banco,
 * usando os mesmos campos que a action grava ao emitir uma cobrança.
 *
 * Os testes unitários de cobranca.test.ts mockam o db, então um descompasso
 * entre o objeto `data` da action e o schema do Prisma (campo inexistente,
 * client desatualizado) passa despercebido. Este teste pega exatamente isso.
 */
const devDb = path.join(process.cwd(), "prisma", "dev.db")
const testDb = path.join(process.cwd(), "prisma", "test-cobranca.db")

let db: PrismaClient
const temDevDb = existsSync(devDb)

describe.skipIf(!temDevDb)("emitirCobranca — integração update", () => {
  beforeAll(() => {
    copyFileSync(devDb, testDb)
    db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: testDb }) })
  })

  afterAll(async () => {
    await db?.$disconnect()
    if (existsSync(testDb)) rmSync(testDb)
  })

  it("grava todos os campos de cobrança que a action escreve", async () => {
    const pagamento = await db.pagamento.findFirst()
    expect(pagamento, "dev.db precisa ter ao menos um pagamento").toBeTruthy()

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
