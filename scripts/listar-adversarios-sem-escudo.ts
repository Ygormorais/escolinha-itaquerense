/**
 * Lista adversários Casa/Fora e se já há escudo (manual / conhecido / URL salva).
 *
 * Uso: npx tsx scripts/listar-adversarios-sem-escudo.ts
 */
import { db } from "../lib/db"
import { escudoManual } from "../lib/landing/escudos-manuais"
import { escudoConhecido } from "../lib/landing/escudo-adversario"

async function main() {
  const rows = await db.partida.findMany({
    where: { local: { in: ["Casa", "Fora"] } },
    distinct: ["adversario"],
    select: { adversario: true, adversarioEscudoUrl: true },
    orderBy: { adversario: "asc" },
  })

  console.log("Adversário".padEnd(52), "Manual", "Conhecido", "DB/FPFS")
  console.log("-".repeat(80))

  let sem = 0
  for (const r of rows) {
    const man = escudoManual(r.adversario)
    const con = escudoConhecido(r.adversario)
    const dbUrl = r.adversarioEscudoUrl
    const ok = !!(man || con || (dbUrl && !dbUrl.includes("admfutsal.com.br")))
    if (!ok) sem++
    console.log(
      r.adversario.slice(0, 50).padEnd(52),
      man ? "SIM" : "·",
      con ? "SIM" : "·",
      dbUrl ? (dbUrl.includes("admfutsal") ? "FPFS" : "URL") : "·",
    )
  }

  console.log("-".repeat(80))
  console.log(`Total: ${rows.length} | sem cobertura clara: ${sem}`)
  console.log("\nPara cadastrar: public/landing/escudos/ + lib/landing/escudos-manuais.json")
  console.log("Ver: public/landing/escudos/README.md")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
