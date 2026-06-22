import { timingSafeEqual } from "crypto"

function isProd(): boolean {
  return process.env.NODE_ENV === "production"
}

/** Exige variável em produção; em dev permite fallback opcional. */
export function requireEnv(name: string, devFallback?: string): string {
  const value = process.env[name]
  if (value) return value
  if (isProd()) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`)
  }
  if (devFallback !== undefined) return devFallback
  throw new Error(`Variável de ambiente ausente: ${name}`)
}

export function getSessionSecret(): string {
  return requireEnv("SESSION_SECRET", "dev-secret")
}

export function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET
  if (secret) return secret
  if (isProd()) throw new Error("Variável de ambiente obrigatória ausente: CRON_SECRET")
  return null
}

export function getEvolutionApiKey(): string | null {
  const key = process.env.EVOLUTION_API_KEY
  if (key) return key
  if (isProd()) throw new Error("Variável de ambiente obrigatória ausente: EVOLUTION_API_KEY")
  return null
}

/** Comparação de tokens em tempo constante (evita timing side-channel). */
function safeEqual(a: string | null | undefined, b: string): boolean {
  if (!a) return false
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function verifyBearerSecret(request: Request, secret: string | null): boolean {
  if (!secret) return false
  return safeEqual(request.headers.get("authorization"), `Bearer ${secret}`)
}

export function verifyEvolutionAuth(request: Request, apiKey: string | null): boolean {
  if (!apiKey) return false
  const auth =
    request.headers.get("apikey") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  return safeEqual(auth, apiKey)
}

export const env = {
  FPFS_SYNC_TOKEN: process.env.FPFS_SYNC_TOKEN ?? "",
}

export function checkCredentialsFromEnv(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME?.trim()
  const expectedPass = process.env.ADMIN_PASSWORD?.trim()
  if (!expectedUser || !expectedPass) {
    if (isProd()) return false
    return username === "admin" && password === "escolinha123"
  }
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
