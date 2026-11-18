export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/client-ip"
import { rateLimitResponse } from "@/lib/rate-limit-response"
import { extrairTokenCalendario } from "@/lib/calendario-feed"
import { gerarFeedPorToken } from "@/lib/calendario-feed-data"

/**
 * Feed iCalendar público do responsável: /api/calendario/<token>.ics (ou sem a extensão).
 * Calendários externos não enviam cookie, então a autorização é o token longo e revogável.
 * Qualquer falha devolve 404 igual, sem revelar se o token existiu.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const limite = checkRateLimit(`calendario:${getClientIp(request)}`, 60, 60_000)
  if (!limite.ok) return rateLimitResponse(limite.retryAfterMs)

  const { token: param } = await params
  const token = extrairTokenCalendario(param)
  const ics = token ? await gerarFeedPorToken(token) : null
  if (!ics) return new NextResponse("Calendário não encontrado.", { status: 404, headers: { "Cache-Control": "no-store" } })

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="escolinha-itaquerense.ics"',
      "Cache-Control": "private, max-age=900",
      "X-Robots-Tag": "noindex, nofollow",
    },
  })
}
