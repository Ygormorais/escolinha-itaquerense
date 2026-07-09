/**
 * Sincroniza FPFS uma vez (CLI). Uso:
 *   npm run fpfs:sync
 *   npx tsx scripts/fpfs-sync-once.ts
 *
 * Em produção o cron chama GET /api/cron/fpfs a cada 2h.
 * No Windows: tarefa agendada "EscolinhaItaquerense-FpfsSync" (install-fpfs-cron.ps1).
 */
import { loadEnv } from "./load-env"

loadEnv()

async function main() {
  // Import dinâmico depois do .env (Prisma/DB leem process.env na carga)
  const { syncTodos } = await import("../lib/fpfs/sync")
  console.log(`[${new Date().toISOString()}] Sincronizando campeonatos ativos da FPFS…\n`)
  const t0 = Date.now()
  const resumos = await syncTodos()
  let novos = 0
  let atualizados = 0
  for (const r of resumos) {
    novos += r.jogosNovos
    atualizados += r.jogosAtualizados
    const flag = r.erro
      ? `ERRO: ${r.erro}`
      : `+${r.jogosNovos} ~${r.jogosAtualizados} classif ${r.linhasClassificacao}`
    console.log(`  #${r.campeonatoId} ${flag}`)
  }
  console.log(
    `\nOK: ${resumos.length} campeonatos | +${novos} novos | ~${atualizados} atualizados | ${Date.now() - t0}ms`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
