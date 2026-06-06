export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { env } from "@/lib/env"
import { syncTodos, syncCampeonato } from "@/lib/fpfs/sync"

export async function POST(request: Request) {
  const token = request.headers.get("x-fpfs-token")
  if (!env.FPFS_SYNC_TOKEN || token !== env.FPFS_SYNC_TOKEN) {
    return NextResponse.json({ erro: "nao autorizado" }, { status: 401 })
  }

  let campeonatoId: number | undefined
  try {
    const body = await request.json()
    if (typeof body?.campeonatoId === "number") campeonatoId = body.campeonatoId
  } catch {
    // body vazio -> sincroniza todos
  }

  try {
    const resultado = campeonatoId != null
      ? [await syncCampeonato(campeonatoId)]
      : await syncTodos()
    return NextResponse.json({ ok: true, resultado })
  } catch (e) {
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 })
  }
}
