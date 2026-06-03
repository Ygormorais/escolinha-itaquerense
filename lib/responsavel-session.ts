import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { getSessionSecret } from "@/lib/env"

const COOKIE_NAME = "responsavel_session"
const MAX_AGE = 60 * 60 * 24 // 1 dia

function sign(value: string): string {
  const secret = getSessionSecret()
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

export async function getResponsavelSession(): Promise<{ authenticated: boolean; responsavelId?: number }> {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  if (!raw) return { authenticated: false }
  const value = verify(raw)
  if (!value || !value.startsWith("resp:")) return { authenticated: false }
  return { authenticated: true, responsavelId: Number(value.slice(5)) }
}

export async function createResponsavelSession(responsavelId: number): Promise<string> {
  return sign(`resp:${responsavelId}`)
}

export function responsavelCookieName() { return COOKIE_NAME }
export function responsavelCookieMaxAge() { return MAX_AGE }
