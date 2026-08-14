import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { checkCredentialsFromEnv, getSessionSecret } from "@/lib/env"
import { SESSION_COOKIE, SESSION_PREFIX } from "@/lib/session-constants"
import { db } from "@/lib/db"

const COOKIE_NAME = SESSION_COOKIE
const MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

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

export type SessionInfo = { authenticated: boolean; user?: string; role?: string }

export async function getSession(): Promise<SessionInfo> {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  if (!raw) return { authenticated: false }
  const value = verify(raw)
  if (!value || !value.startsWith(SESSION_PREFIX)) return { authenticated: false }
  const parts = value.slice(SESSION_PREFIX.length).split(":")
  const username = parts[0]
  if (!username) return { authenticated: false }

  // A assinatura protege a integridade do cookie, mas não revoga uma sessão já
  // emitida. Confirma a conta a cada request para que desativação, exclusão ou
  // troca de perfil tenham efeito imediato.
  const usuario = await db.usuario.findUnique({
    where: { username },
    select: { ativo: true, role: true },
  })
  if (!usuario?.ativo) return { authenticated: false }

  return { authenticated: true, user: username, role: usuario.role }
}

export async function createSession(username: string, role = "admin"): Promise<string> {
  return sign(`${SESSION_PREFIX}${username}:${role}`)
}

export function cookieName() { return COOKIE_NAME }
export function cookieMaxAge() { return MAX_AGE }

export function checkCredentials(username: string, password: string): boolean {
  return checkCredentialsFromEnv(username, password)
}
