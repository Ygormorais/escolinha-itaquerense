/**
 * Varre IDs de eventos FPFS em busca de jogos do time Elite/Itaquerense.
 * Uso: npx tsx scripts/find-fpfs-events.ts [fromId] [toId]
 */
import { fetchHtml, urlJogos, urlClassificacao } from "../lib/fpfs/client"
import { parseJogos } from "../lib/fpfs/parser"

function isNosso(nome: string): boolean {
  const n = nome.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
  return (
    n.includes("itaquerense") ||
    (n.includes("elite") && (n.includes("itaquera") || n.includes("itaquer")))
  )
}

async function scan(from: number, to: number) {
  const hits: {
    id: number
    title: string
    timeNome: string
    jogosNossos: number
    amostra: string[]
  }[] = []

  for (let id = from; id <= to; id++) {
    try {
      const html = await fetchHtml(urlJogos(id))
      const jogos = parseJogos(html, 2026)
      const nossos = jogos.filter((j) => isNosso(j.mandante) || isNosso(j.visitante))
      if (nossos.length === 0) {
        process.stdout.write(".")
        continue
      }
      const timeNome =
        nossos
          .flatMap((j) => [j.mandante, j.visitante])
          .find((n) => isNosso(n)) ?? "Elite Itaquerense"
      const titleMatch = html.match(/<title>([^<]+)/i)
      const title = (titleMatch?.[1] ?? `Evento ${id}`).replace(/\s+/g, " ").trim()
      hits.push({
        id,
        title,
        timeNome,
        jogosNossos: nossos.length,
        amostra: nossos.slice(0, 3).map(
          (j) =>
            `${j.data} ${j.mandante} ${j.golsMandante ?? "-"}x${j.golsVisitante ?? "-"} ${j.visitante}`
        ),
      })
      process.stdout.write(`\nHIT ${id} (${nossos.length} jogos)\n`)
    } catch {
      process.stdout.write("x")
    }
  }

  console.log("\n\n=== HITS (time, não ginásio) ===")
  console.log(JSON.stringify(hits, null, 2))
}

const from = Number(process.argv[2] ?? 850)
const to = Number(process.argv[3] ?? 980)
console.log(`Scanning times Elite/Itaquerense em eventos ${from}..${to}`)
scan(from, to).catch((e) => {
  console.error(e)
  process.exit(1)
})
