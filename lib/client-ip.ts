/**
 * IP do cliente para rate limit. O proxy (Railway) acrescenta o IP real no FIM
 * do X-Forwarded-For; os valores anteriores vêm do cliente e podem ser forjados.
 * Por isso usamos só o último valor.
 */
export function getClientIp(request: Request): string {
  return getClientIpFromHeaders(request.headers)
}

/** Mesma regra para quem só tem os cabeçalhos (ex.: ações de servidor via headers()). */
export function getClientIpFromHeaders(headers: Pick<Headers, "get">): string {
  const xff = headers.get("x-forwarded-for")
  if (!xff) return "unknown"
  const partes = xff.split(",").map((p) => p.trim()).filter(Boolean)
  return partes[partes.length - 1] ?? "unknown"
}

/** Normaliza o identificador da conta (username/e-mail) para a chave de limite. */
export function accountKey(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : ""
}

const QUINZE_MIN = 15 * 60_000

/**
 * Limite por conta, independente do IP: barra força bruta distribuída.
 * Fora de produção (dev/e2e) fica folgado para não travar a suíte.
 */
export function accountLimit(prodMax: number): { max: number; windowMs: number } {
  return {
    max: process.env.NODE_ENV === "production" ? prodMax : 1000,
    windowMs: QUINZE_MIN,
  }
}
