export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { montarCalendario } from "@/lib/icalendar"
import { eventoDePartida } from "@/lib/calendario-feed"

/** Baixa o .ics de um jogo (botão "Adicionar ao calendário" do portal). Exige sessão de responsável. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { id: idParam } = await params
  const id = /^\d{1,9}$/.test(idParam) ? Number(idParam) : NaN
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Jogo inválido" }, { status: 400 })

  const partida = await db.partida.findUnique({
    where: { id },
    select: { id: true, data: true, adversario: true, local: true, campeonato: { select: { nome: true } } },
  })
  if (!partida) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })

  const ics = montarCalendario([eventoDePartida(partida)], { nome: `Jogo vs ${partida.adversario}`, metodo: "PUBLISH" })
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="jogo-${partida.id}.ics"`,
      "Cache-Control": "private, no-store",
    },
  })
}
