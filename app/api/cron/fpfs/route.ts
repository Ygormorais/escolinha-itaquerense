import { NextResponse } from "next/server"
import { getCronSecret, verifyBearerSecret } from "@/lib/env"
import { syncTodos, syncCampeonato } from "@/lib/fpfs/sync"

export async function GET(request: Request) {
  const secret = getCronSecret()
  if (!verifyBearerSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const param = new URL(request.url).searchParams.get("campeonatoId")
  const campeonatoId = param != null ? Number(param) : null

  try {
    const resultado =
      campeonatoId != null && Number.isFinite(campeonatoId)
        ? [await syncCampeonato(campeonatoId)]
        : await syncTodos()
    return NextResponse.json({ ok: true, resultado, executadoEm: new Date().toISOString() })
  } catch (e) {
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 })
  }
}
