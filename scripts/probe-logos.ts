import { db } from "../lib/db"

function slugify(name: string): string[] {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const parts = base.split("-").filter(Boolean)
  const candidates = new Set<string>()
  candidates.add(base)
  // primeiras 2-3 palavras
  if (parts.length >= 2) candidates.add(parts.slice(0, 2).join("-"))
  if (parts.length >= 3) candidates.add(parts.slice(0, 3).join("-"))
  // sem palavras genéricas
  const stop = new Set([
    "associacao",
    "sociedade",
    "esportiva",
    "clube",
    "atletico",
    "futsal",
    "futebol",
    "de",
    "da",
    "do",
    "e",
    "fc",
    "ec",
    "sc",
    "se",
    "ae",
    "ac",
    "liga",
  ])
  const meaningful = parts.filter((p) => !stop.has(p) && p.length > 2)
  if (meaningful.length >= 1) candidates.add(meaningful[0])
  if (meaningful.length >= 2) candidates.add(meaningful.slice(0, 2).join("-"))
  return [...candidates]
}

async function probe(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" },
      redirect: "follow",
    })
    if (!r.ok) return false
    const ct = r.headers.get("content-type") || ""
    if (!ct.startsWith("image/")) return false
    const n = (await r.arrayBuffer()).byteLength
    return n > 500
  } catch {
    return false
  }
}

async function main() {
  const rows = await db.partida.findMany({
    where: { local: { in: ["Casa", "Fora"] } },
    select: { adversario: true },
    distinct: ["adversario"],
    take: 25,
    orderBy: { data: "desc" },
  })

  console.log("Testando", rows.length, "adversários…\n")

  for (const { adversario } of rows) {
    const slugs = slugify(adversario)
    let found: string | null = null
    for (const s of slugs) {
      const url = `https://logodetimes.com/times/${s}/logo-${s}-256.png`
      if (await probe(url)) {
        found = url
        break
      }
    }
    // Wikipedia search API (opensearch) — free, no key
    if (!found) {
      const q = encodeURIComponent(adversario.split(/[|/]/)[0].trim() + " escudo")
      try {
        const api = `https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrlimit=3&prop=pageimages&piprop=thumbnail&pithumbsize=120&format=json&origin=*`
        const res = await fetch(api, {
          headers: { "User-Agent": "EliteItaquerenseBot/1.0 (landing escudos)" },
        })
        if (res.ok) {
          const data = (await res.json()) as {
            query?: { pages?: Record<string, { thumbnail?: { source: string }; title?: string }> }
          }
          const pages = Object.values(data.query?.pages ?? {})
          for (const p of pages) {
            if (p.thumbnail?.source) {
              found = `${p.thumbnail.source} | wiki:${p.title}`
              break
            }
          }
        }
      } catch {
        /* ignore */
      }
    }

    console.log(found ? "OK " : "NO ", adversario.slice(0, 50).padEnd(50), found ?? "")
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
