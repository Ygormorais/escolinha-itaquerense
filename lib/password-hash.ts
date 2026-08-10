import { getRounds } from "bcryptjs"

export const BCRYPT_COST = 12

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$(?:0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/

export function bcryptRounds(hash: string): number | null {
  if (!BCRYPT_HASH_PATTERN.test(hash)) return null

  const rounds = getRounds(hash)
  return Number.isInteger(rounds) ? rounds : null
}

export function isBcryptHash(hash: string): boolean {
  return bcryptRounds(hash) !== null
}

export function needsBcryptRehash(hash: string): boolean {
  const rounds = bcryptRounds(hash)
  return rounds !== null && rounds < BCRYPT_COST
}
