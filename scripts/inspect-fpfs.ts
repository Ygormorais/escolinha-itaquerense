import { db } from "../lib/db"

async function main() {
  const campeonatos = await db.campeonato.findMany({
    select: {
      id: true,
      nome: true,
      fpfsEventoId: true,
      fpfsTimeNome: true,
      fpfsSyncEm: true,
      _count: { select: { partidas: true } },
    },
    orderBy: { id: "asc" },
  })
  console.log("=== CAMPEONATOS ===")
  console.log(JSON.stringify(campeonatos, null, 2))

  const partidas = await db.partida.findMany({
    take: 12,
    orderBy: { data: "desc" },
    select: {
      id: true,
      adversario: true,
      data: true,
      golsPro: true,
      golsContra: true,
      resultado: true,
      sumulaUrl: true,
      fpfsJogoId: true,
      campeonato: { select: { nome: true, fpfsEventoId: true, fpfsTimeNome: true } },
    },
  })
  console.log("=== PARTIDAS (12) ===")
  console.log(JSON.stringify(partidas, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
