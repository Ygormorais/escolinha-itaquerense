/**
 * 1) Lista adversários mais frequentes
 * 2) Resolve escudo (manual/conhecido/logodetimes/wiki)
 * 3) Baixa para public/landing/escudos/ quando for URL externa
 * 4) Atualiza escudos-manuais.json
 *
 * Uso: npx tsx scripts/preencher-escudos-frequentes.ts
 */
import fs from "node:fs"
import path from "node:path"
import { db } from "../lib/db"
import { resolveEscudoAdversario } from "../lib/landing/escudo-adversario"
import { escudoManual } from "../lib/landing/escudos-manuais"
import type { EscudoManual } from "../lib/landing/escudos-manuais"

const OUT_DIR = path.join(process.cwd(), "public", "landing", "escudos")
const JSON_PATH = path.join(process.cwd(), "lib", "landing", "escudos-manuais.json")

function slugFile(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\|.*$/, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "time"
}

function containsKey(name: string): string {
  // palavra mais distintiva para "contains"
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
    "liga",
    "instituto",
  ])
  const parts = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 2 && !stop.has(p.toLowerCase()))
  return parts.sort((a, b) => b.length - a.length)[0] || name.slice(0, 12).toUpperCase()
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EliteItaquerense/1.0)",
        Accept: "image/*",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return false
    const ct = r.headers.get("content-type") || ""
    if (!ct.startsWith("image/")) return false
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length < 400) return false
    fs.writeFileSync(dest, buf)
    return true
  } catch {
    return false
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const grouped = await db.partida.groupBy({
    by: ["adversario"],
    where: { local: { in: ["Casa", "Fora"] } },
    _count: { adversario: true },
    orderBy: { _count: { adversario: "desc" } },
    take: 40,
  })

  const existing = JSON.parse(fs.readFileSync(JSON_PATH, "utf8")) as EscudoManual[]
  const byContains = new Map(
    existing
      .filter((e) => e.contains)
      .map((e) => [e.contains!.toUpperCase(), e] as const),
  )

  console.log("Top adversários e resolução de escudo:\n")

  let baixados = 0
  let resolvidos = 0
  let falhas = 0

  for (const g of grouped) {
    const nome = g.adversario
    const count = g._count.adversario
    const sample = await db.partida.findFirst({
      where: { adversario: nome },
      select: { adversarioEscudoUrl: true },
    })

    // se já tem arquivo manual local existente, ok
    const man = escudoManual(nome)
    if (man?.startsWith("/landing/escudos/")) {
      const file = path.join(process.cwd(), "public", man.replace(/^\//, ""))
      if (fs.existsSync(file)) {
        console.log(`OK  x${count}  [arquivo]  ${nome}`)
        resolvidos++
        continue
      }
    }

    const url = await resolveEscudoAdversario(nome, sample?.adversarioEscudoUrl)
    if (!url) {
      console.log(`NO  x${count}  ${nome}`)
      falhas++
      // garante entrada no JSON para o usuário preencher depois
      const key = containsKey(nome)
      if (!byContains.has(key)) {
        const file = `${slugFile(nome)}.png`
        byContains.set(key, {
          contains: key,
          src: `/landing/escudos/${file}`,
          nota: `TODO: adicionar ${file} (adversário: ${nome})`,
        })
      }
      continue
    }

    resolvidos++

    // baixa externos para pasta local (estável offline)
    if (url.startsWith("http")) {
      const file = `${slugFile(nome)}.png`
      const dest = path.join(OUT_DIR, file)
      const ok = await download(url, dest)
      if (ok) {
        baixados++
        const key = containsKey(nome)
        byContains.set(key, {
          contains: key,
          src: `/landing/escudos/${file}`,
          nota: `auto: ${nome}`,
        })
        console.log(`OK  x${count}  [baixado]  ${nome} ← ${url.slice(0, 60)}`)
      } else {
        // mantém URL externa no JSON
        const key = containsKey(nome)
        byContains.set(key, {
          contains: key,
          src: url,
          nota: `auto-url: ${nome}`,
        })
        console.log(`OK  x${count}  [url]      ${nome}`)
      }
    } else {
      console.log(`OK  x${count}  [local]    ${nome}`)
    }
  }

  const next = [...byContains.values()].sort((a, b) =>
    (a.contains || a.equals || "").localeCompare(b.contains || b.equals || ""),
  )
  fs.writeFileSync(JSON_PATH, JSON.stringify(next, null, 2) + "\n", "utf8")

  console.log("\n---")
  console.log(`Resolvidos: ${resolvidos} | Baixados: ${baixados} | Sem logo: ${falhas}`)
  console.log(`JSON atualizado: ${JSON_PATH}`)
  console.log(`Arquivos em: ${OUT_DIR}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
