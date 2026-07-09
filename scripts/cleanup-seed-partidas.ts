import { db } from "../lib/db"

/** Remove partidas manuais/seed em campeonatos que já têm sync FPFS (sem fpfsJogoId). */
async function main() {
  const camps = await db.campeonato.findMany({
    where: { fpfsEventoId: { not: null } },
    select: { id: true, nome: true },
  })
  for (const c of camps) {
    const r = await db.partida.deleteMany({
      where: {
        campeonatoId: c.id,
        OR: [{ fpfsJogoId: null }, { fpfsJogoId: "" }],
      },
    })
    if (r.count > 0) console.log(`#${c.id} ${c.nome}: removidas ${r.count} partidas seed`)
  }
  const nossos = await db.partida.count({ where: { local: { in: ["Casa", "Fora"] }, fpfsJogoId: { not: null } } })
  console.log("Partidas Elite com FPFS:", nossos)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => process.exit(0))
