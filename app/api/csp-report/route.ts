export const dynamic = "force-dynamic"

import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/client-ip"
import { logger } from "@/lib/logger"

/** Mantém só caminho (sem query/fragmento): URLs podem trazer dado pessoal. */
function semQuery(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined
  const limpo = valor.split(/[?#]/)[0]
  return limpo.slice(0, 200)
}

function texto(valor: unknown, max = 120): string | undefined {
  return typeof valor === "string" ? valor.slice(0, max) : undefined
}

/**
 * Recebe os relatórios do Content-Security-Policy-Report-Only. Público (o navegador
 * envia sem cookie), com limite por IP, corpo pequeno e log só dos campos úteis,
 * sem IP, cookies, query string nem trecho de código da página.
 */
export async function POST(request: Request) {
  const limite = checkRateLimit(`csp-report:${getClientIp(request)}`, 30, 60_000)
  if (!limite.ok) return new Response(null, { status: 204 })

  try {
    const bruto = await request.text()
    if (bruto.length > 8_192) return new Response(null, { status: 204 })
    const corpo: unknown = JSON.parse(bruto)
    const relatorio =
      corpo && typeof corpo === "object" && "csp-report" in corpo
        ? (corpo as Record<string, unknown>)["csp-report"]
        : corpo
    if (relatorio && typeof relatorio === "object") {
      const r = relatorio as Record<string, unknown>
      logger.warn("csp: violação (report-only)", {
        diretiva: texto(r["violated-directive"] ?? r["effectiveDirective"]),
        bloqueado: semQuery(r["blocked-uri"] ?? r["blockedURL"]),
        pagina: semQuery(r["document-uri"] ?? r["documentURL"]),
      })
    }
  } catch {
    // relatório malformado: ignora
  }
  return new Response(null, { status: 204 })
}
