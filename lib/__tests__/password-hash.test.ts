import { hashSync } from "bcryptjs"
import { describe, expect, it } from "vitest"
import { BCRYPT_COST, bcryptRounds, isBcryptHash, needsBcryptRehash } from "../password-hash"

describe("password-hash", () => {
  it("reconhece hashes bcrypt válidos", () => {
    const hash = hashSync("senha-forte", BCRYPT_COST)

    expect(isBcryptHash(hash)).toBe(true)
    expect(bcryptRounds(hash)).toBe(BCRYPT_COST)
    expect(needsBcryptRehash(hash)).toBe(false)
  })

  it("marca bcrypt de custo antigo para atualização", () => {
    const hash = hashSync("senha-forte", 10)

    expect(isBcryptHash(hash)).toBe(true)
    expect(needsBcryptRehash(hash)).toBe(true)
  })

  it("rejeita o formato HMAC legado e valores malformados", () => {
    expect(isBcryptHash("a".repeat(64))).toBe(false)
    expect(isBcryptHash("$2b$12$curto")).toBe(false)
    expect(needsBcryptRehash("a".repeat(64))).toBe(false)
  })
})
