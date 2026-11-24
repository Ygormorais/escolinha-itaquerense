export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/client-ip"
import { rateLimitResponse } from "@/lib/rate-limit-response"
import { montarCalendario } from "@/lib/icalendar"
import { eventoIcsDaJanela } from "@/lib/aula-experimental"

/**
 * Arquivo .ics de uma aula experimental, para a família salvar no calendário. Só carrega dados da
 * própria janela (turma, data, hora, local): nada de nome de criança ou contato, então pode ser público.
 */
export async function GET(request: Request, { params }: { params: Promise<{ janelaId: string }> }) {
  const limite = checkRateLimit(`aula-experimental-ics:${getClientIp(request)}`, 30, 60_000)
  if (!limite.ok) return rateLimitResponse(limite.retryAfterMs)

  const { janelaId } = await params
  const id = /^\d{1,9}$/.test(janelaId) ? Number(janelaId) : null
  const janela = id ? await db.janelaAulaExperimental.findUnique({ where: { id } }) : null
  // "Fechar no site" só para novas inscrições: quem já agendou continua podendo baixar o evento.
  if (!janela) {
    return new NextResponse("Aula não encontrada.", { status: 404, headers: { "Cache-Control": "no-store" } })
  }

  const clube = getConfig().nome
  const ics = montarCalendario([eventoIcsDaJanela(janela, clube)], {
    nome: `Aula experimental — ${clube}`,
    metodo: "PUBLISH",
  })
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aula-experimental.ics"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  })
}
