import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "escolinha_session"
const MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

function sign(value: string): string {
  const secret = process.env.SESSION_SECRET ?? "dev-secret"
  const hmac = createHmac("sha256", secret).update(value).digest("hex")
  return `${value}.${hmac}`
}

function verify(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".")
  if (lastDot === -1) return null
  const value = signed.slice(0, lastDot)
  const expected = sign(value)
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(signed)
    if (a.length !== b.length) return null
    if (!timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  return value
}

export async function getSession(): Promise<{ authenticated: boolean; user?: string }> {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  if (!raw) return { authenticated: false }
  const value = verify(raw)
  if (!value || !value.startsWith("auth:")) return { authenticated: false }
  const user = value.slice(5)
  return { authenticated: true, user }
}

export async function createSession(username: string): Promise<string> {
  return sign(`auth:${username}`)
}

export function cookieName() { return COOKIE_NAME }
export function cookieMaxAge() { return MAX_AGE }

export function checkCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME ?? "admin"
  const expectedPass = process.env.ADMIN_PASSWORD ?? "escolinha123"
  try {
    const ua = Buffer.from(expectedUser)
    const ub = Buffer.from(username)
    const pa = Buffer.from(expectedPass)
    const pb = Buffer.from(password)
    const userMatch = ua.length === ub.length && timingSafeEqual(ua, ub)
    const passMatch = pa.length === pb.length && timingSafeEqual(pa, pb)
    return userMatch && passMatch
  } catch {
    return false
  }
}
