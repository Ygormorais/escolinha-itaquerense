import { createHmac, randomBytes, timingSafeEqual } from "crypto"
import { getSessionSecret } from "@/lib/env"

const TOKEN_VERSION = 1
export const CHECKIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000

export type CheckinTokenClaims = {
  v: typeof TOKEN_VERSION
  turma: string
  data: string
  iat: number
  exp: number
  nonce: string
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T12:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function isValidTurma(value: string): boolean {
  return value.length >= 1 && value.length <= 80 && !/[\u0000-\u001f]/.test(value)
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url")
}

export function createCheckinToken(turma: string, data: string, now = Date.now()): string {
  if (!isValidTurma(turma) || !isValidDate(data)) {
    throw new Error("Turma ou data inválida para o check-in.")
  }

  const claims: CheckinTokenClaims = {
    v: TOKEN_VERSION,
    turma,
    data,
    iat: now,
    exp: now + CHECKIN_TOKEN_TTL_MS,
    nonce: randomBytes(16).toString("base64url"),
  }
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function verifyCheckinToken(token: string, now = Date.now()): CheckinTokenClaims | null {
  if (token.length > 1024) return null
  const parts = token.split(".")
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null

  const [payload, providedSignature] = parts
  const expectedSignature = sign(payload)
  try {
    const provided = Buffer.from(providedSignature)
    const expected = Buffer.from(expectedSignature)
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null
  } catch {
    return null
  }

  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<CheckinTokenClaims>
    if (
      value.v !== TOKEN_VERSION ||
      typeof value.turma !== "string" ||
      !isValidTurma(value.turma) ||
      typeof value.data !== "string" ||
      !isValidDate(value.data) ||
      typeof value.iat !== "number" ||
      typeof value.exp !== "number" ||
      typeof value.nonce !== "string" ||
      !/^[A-Za-z0-9_-]{20,30}$/.test(value.nonce) ||
      value.exp <= now ||
      value.exp - value.iat !== CHECKIN_TOKEN_TTL_MS
    ) {
      return null
    }
    return value as CheckinTokenClaims
  } catch {
    return null
  }
}
