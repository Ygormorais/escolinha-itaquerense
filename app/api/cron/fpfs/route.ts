export const dynamic = "force-dynamic"
/** Sync de vários eventos FPFS pode passar de 60s em cold start. */
export const maxDuration = 300

import { NextResponse } from "next/server"
import { getCronSecret, verifyBearerSecret } from "@/lib/env"
import { syncTodos, syncCampeonato } from "@/lib/fpfs/sync"
import { revalidateFpfsPublico } from "@/lib/fpfs/revalidate-public"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  const secret = getCronSecret()
  if (!verifyBearerSecret(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const param = new URL(request.url).searchParams.get("campeonatoId")
  const campeonatoId = param != null ? Number(param) : null
  const t0 = performance.now()

  try {
    const resultado =
      campeonatoId != null && Number.isFinite(campeonatoId)
        ? [await syncCampeonato(campeonatoId)]
        : await syncTodos()

    revalidateFpfsPublico()

    const totais = resultado.reduce(
      (acc, r) => ({
        novos: acc.novos + r.jogosNovos,
        atualizados: acc.atualizados + r.jogosAtualizados,
        erros: acc.erros + (r.erro ? 1 : 0),
      }),
      { novos: 0, atualizados: 0, erros: 0 },
    )

    logger.info("cron/fpfs: ok", {
      campeonatos: resultado.length,
      ...totais,
      durMs: Math.round(performance.now() - t0),
    })

    return NextResponse.json({
      ok: true,
      resultado,
      totais,
      executadoEm: new Date().toISOString(),
    })
  } catch (e) {
    logger.error("cron/fpfs: falha", { error: String(e) })
    return NextResponse.json({ ok: false, erro: String(e) }, { status: 500 })
  }
}

/** Também aceita POST (alguns hosts de cron só enviam POST). */
export async function POST(request: Request) {
  return GET(request)
}
