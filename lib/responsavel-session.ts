import { cache } from "react"
import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"
import { getSessionSecret } from "@/lib/env"
import { db } from "@/lib/db"

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

/** Deduplica leitura do cookie na mesma request (layout + page). */
export const getResponsavelSession = cache(async (): Promise<{ authenticated: boolean; responsavelId?: number }> => {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  if (!raw) return { authenticated: false }
  const value = verify(raw)
  if (!value || !value.startsWith("resp:")) return { authenticated: false }
  // Formato: resp:id:iat:versao. Cookie do formato antigo (resp:id) não vale mais.
  const [idStr, iatStr, versaoStr] = value.slice(5).split(":")
  const responsavelId = Number(idStr)
  const iat = Number(iatStr)
  const versao = Number(versaoStr)
  if (!Number.isSafeInteger(responsavelId) || responsavelId <= 0) return { authenticated: false }
  if (!Number.isSafeInteger(iat) || !Number.isSafeInteger(versao)) return { authenticated: false }
  const agora = Math.floor(Date.now() / 1000)
  if (agora - iat > MAX_AGE || iat - agora > 300) return { authenticated: false }

  const responsavel = await db.responsavel.findUnique({
    where: { id: responsavelId },
    select: { ativo: true, sessaoVersao: true },
  })
  if (!responsavel?.ativo) return { authenticated: false }
  if (responsavel.sessaoVersao !== versao) return { authenticated: false }

  return { authenticated: true, responsavelId }
})

export async function createResponsavelSession(responsavelId: number, versao = 0): Promise<string> {
  return sign(`resp:${responsavelId}:${Math.floor(Date.now() / 1000)}:${versao}`)
}

/** Revoga todos os cookies do responsável (redefinição de senha, logout). */
export async function revogarSessoesResponsavel(responsavelId: number): Promise<void> {
  await db.responsavel.updateMany({ where: { id: responsavelId }, data: { sessaoVersao: { increment: 1 } } })
}

export function responsavelCookieName() { return COOKIE_NAME }
export function responsavelCookieMaxAge() { return MAX_AGE }
