import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { checkCredentialsFromEnv, getSessionSecret, isEnvAdminUsername } from "@/lib/env"
import { SESSION_COOKIE, SESSION_PREFIX, SESSION_MAX_AGE_SECONDS } from "@/lib/session-constants"
import { db } from "@/lib/db"

const COOKIE_NAME = SESSION_COOKIE
const MAX_AGE = SESSION_MAX_AGE_SECONDS

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

/** Segundos desde a época (iat gravado no cookie). */
const agoraSeg = () => Math.floor(Date.now() / 1000)

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
  // Formato: user:role:origem:iat:versao. Cookie sem iat/versão (formato antigo)
  // não vale: nunca expiraria. Exige novo login uma única vez.
  const iat = Number(parts[3])
  const versao = Number(parts[4])
  if (!Number.isSafeInteger(iat) || !Number.isSafeInteger(versao)) return { authenticated: false }
  // Expiração no servidor (o maxAge do cookie só vale para o navegador).
  if (agoraSeg() - iat > MAX_AGE || iat - agoraSeg() > 300) return { authenticated: false }

  const usuario = await db.usuario.findUnique({
    where: { username },
    select: { ativo: true, role: true, sessaoVersao: true },
  })
  // O administrador do .env não tem conta no banco; o login o aceita, então a sessão também.
  // Só vale para sessão emitida pelo login do .env: um cookie de conta do banco que foi
  // excluída não pode virar admin só por ter o mesmo nome. Conta existente prevalece.
  if (!usuario) {
    return parts[2] === "env" && versao === 0 && isEnvAdminUsername(username)
      ? { authenticated: true, user: username, role: "admin" }
      : { authenticated: false }
  }
  if (!usuario.ativo) return { authenticated: false }
  // Troca de senha ou logout incrementam a versão e revogam os cookies antigos.
  if (usuario.sessaoVersao !== versao) return { authenticated: false }

  return { authenticated: true, user: username, role: usuario.role }
}

/** origem "env": sessão do administrador do .env; "db": conta da tabela de usuários. */
export async function createSession(
  username: string,
  role = "admin",
  origem: "db" | "env" = "db",
  versao = 0
): Promise<string> {
  return sign(`${SESSION_PREFIX}${username}:${role}:${origem}:${agoraSeg()}:${versao}`)
}

/** Revoga todos os cookies da conta (troca de senha, logout). Admin do .env não tem conta no banco. */
export async function revogarSessoesUsuario(username: string): Promise<void> {
  await db.usuario.updateMany({ where: { username }, data: { sessaoVersao: { increment: 1 } } })
}

export function cookieName() { return COOKIE_NAME }
export function cookieMaxAge() { return MAX_AGE }

export function checkCredentials(username: string, password: string): boolean {
  return checkCredentialsFromEnv(username, password)
}
