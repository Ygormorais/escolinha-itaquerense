/**
 * Resolve escudo do adversário (clubes grandes e menores).
 *
 * Ordem:
 * 0) Cadastro manual (lib/landing/escudos-manuais.json + public/landing/escudos/)
 * 1) Mapa fixo de clubes conhecidos
 * 2) logodetimes.com (probe HTTP — clubes médios BR)
 * 3) Wikipedia PT (só se o título for bem parecido)
 * 4) URL da FPFS (muitos 404 hoje; fica por último)
 *
 * Cache em memória por processo + grava de volta em Partida.adversarioEscudoUrl
 * quando achar logo pública melhor.
 */

import { normalizeEscudoUrl } from "@/lib/fpfs/parser"
import { escudoManual } from "@/lib/landing/escudos-manuais"

const STOP = new Set([
  "associacao",
  "associação",
  "sociedade",
  "esportiva",
  "esporte",
  "clube",
  "atletico",
  "atlético",
  "futsal",
  "futebol",
  "salao",
  "salão",
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "fc",
  "ec",
  "sc",
  "se",
  "ae",
  "ac",
  "aa",
  "ad",
  "liga",
  "instituto",
  "projeto",
  "time",
  "team",
  "brasil",
  "paulista",
])

/** Clubes com logo estável (não depende de probe). */
const CONHECIDOS: { re: RegExp; url: string }[] = [
  { re: /CORINTHIANS/i, url: "https://logodetimes.com/times/corinthians/logo-corinthians-256.png" },
  { re: /S[AÃ]O\s*PAULO\s*FUTEBOL|SAO\s*PAULO\s*FUTEBOL|^S[AÃ]O\s*PAULO$/i, url: "https://logodetimes.com/times/sao-paulo/logo-sao-paulo-256.png" },
  { re: /PALMEIRAS/i, url: "https://logodetimes.com/times/palmeiras/logo-palmeiras-256.png" },
  { re: /\bSANTOS\s*FUTEBOL|\bSANTOS\s*FC\b/i, url: "https://logodetimes.com/times/santos/logo-santos-256.png" },
  { re: /GUARANI/i, url: "https://logodetimes.com/times/guarani/logo-guarani-256.png" },
  { re: /PONTE\s*PRETA/i, url: "https://logodetimes.com/times/ponte-preta/logo-ponte-preta-256.png" },
  { re: /BRAGANTINO|RED\s*BULL/i, url: "https://logodetimes.com/times/red-bull-bragantino/logo-red-bull-bragantino-256.png" },
  { re: /MIRASSOL/i, url: "https://logodetimes.com/times/mirassol/logo-mirassol-256.png" },
  { re: /BOTAFOGO.*SP|BOTAFOGO\s*F/i, url: "https://logodetimes.com/times/botafogo-sp/logo-botafogo-sp-256.png" },
  { re: /S[AÃ]O\s*BERNARDO/i, url: "https://logodetimes.com/times/sao-bernardo/logo-sao-bernardo-256.png" },
  { re: /S[AÃ]O\s*CAETANO/i, url: "https://logodetimes.com/times/sao-caetano/logo-sao-caetano-256.png" },
  { re: /SANTO\s*ANDR[EÉ]/i, url: "https://logodetimes.com/times/santo-andre/logo-santo-andre-256.png" },
  { re: /FLAMENGO/i, url: "https://logodetimes.com/times/flamengo/logo-flamengo-256.png" },
  { re: /PORTUGUESA/i, url: "https://logodetimes.com/times/portuguesa/logo-portuguesa-256.png" },
  { re: /ITUANO/i, url: "https://logodetimes.com/times/ituano/logo-ituano-256.png" },
  { re: /FERROVI[AÁ]RIA/i, url: "https://logodetimes.com/times/ferroviaria/logo-ferroviaria-256.png" },
  { re: /[AÁ]GUA\s*SANTA/i, url: "https://logodetimes.com/times/agua-santa/logo-agua-santa-256.png" },
  { re: /INTER(NACIONAL)?\s*(DE\s*)?LIMEIRA/i, url: "https://logodetimes.com/times/inter-de-limeira/logo-inter-de-limeira-256.png" },
  // Futsal de ponta (quando o slug existir no logodetimes; probe confirma)
  { re: /\bMAGNUS\b/i, url: "https://logodetimes.com/times/magnus-futsal/logo-magnus-futsal-256.png" },
]

const cache = new Map<string, string | null>()

function normalizeKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
}

function meaningfulTokens(name: string): string[] {
  return normalizeKey(name)
    .toLowerCase()
    .split(" ")
    .filter((t) => t.length > 2 && !STOP.has(t))
}

/** Gera slugs candidatos para logodetimes.com */
export function slugCandidates(name: string): string[] {
  const raw = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\|.*$/, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const parts = raw.split("-").filter(Boolean)
  const out = new Set<string>()
  out.add(raw)

  const meaningful = parts.filter((p) => !STOP.has(p) && p.length > 2)
  if (meaningful.length >= 1) out.add(meaningful[0])
  if (meaningful.length >= 2) out.add(meaningful.slice(0, 2).join("-"))
  if (meaningful.length >= 3) out.add(meaningful.slice(0, 3).join("-"))
  // variantes comuns
  if (meaningful[0]) {
    out.add(`${meaningful[0]}-futsal`)
    out.add(`${meaningful[0]}-fc`)
    out.add(`${meaningful[0]}-sp`)
  }
  if (meaningful.length >= 2) {
    out.add(`${meaningful[0]}-${meaningful[1]}-futsal`)
  }
  return [...out].filter((s) => s.length >= 3 && s.length < 48)
}

async function isImageUrl(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EliteItaquerense/1.0)",
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(4000),
    })
    if (!r.ok) return false
    const ct = r.headers.get("content-type") || ""
    if (!ct.startsWith("image/")) return false
    // HEAD às vezes não vem com length; GET leve
    const buf = await r.arrayBuffer()
    return buf.byteLength > 400
  } catch {
    return false
  }
}

function titleMatchesTeam(team: string, title: string): boolean {
  const tokens = meaningfulTokens(team)
  if (tokens.length === 0) return false
  const t = normalizeKey(title).toLowerCase()

  // rejeita páginas de cidade/país/estádio/outros clubes estrangeiros
  if (
    /\b(portugal|lisboa|madrid|barcelona|italy|italia|cidade|munic[ií]pio|estadio|est[aá]dio|rio|serra|praia)\b/i.test(
      title,
    ) &&
    !/futebol|futsal|clube|associa|esporte|esportiva/i.test(title)
  ) {
    return false
  }

  const hits = tokens.filter((tok) => t.includes(tok))
  // exige presença de contexto esportivo no título
  const sportsContext = /futebol|futsal|clube|associa|esporte|esportiva|atl[eé]tico|escudo|bras[aã]o/i.test(
    title,
  )
  if (!sportsContext) return false
  if (tokens.length === 1) return hits.length === 1 && tokens[0].length >= 5
  return hits.length >= 2
}

async function wikiThumb(name: string): Promise<string | null> {
  const clean = name.replace(/\|.*$/, "").replace(/\/.*$/, "").trim()
  // busca explícita por clube/escudo — reduz falso positivo de cidade
  const query = encodeURIComponent(`"${clean}" (futebol OR futsal OR clube)`)
  try {
    const api =
      `https://pt.wikipedia.org/w/api.php?action=query&generator=search` +
      `&gsrsearch=${query}&gsrlimit=5&prop=pageimages|info&inprop=url` +
      `&piprop=thumbnail&pithumbsize=160&format=json`
    const res = await fetch(api, {
      headers: { "User-Agent": "EliteItaquerenseBot/1.0 (landing; escudos)" },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          { title?: string; thumbnail?: { source?: string } }
        >
      }
    }
    const pages = Object.values(data.query?.pages ?? {})
    for (const p of pages) {
      if (!p.title || !p.thumbnail?.source) continue
      if (!titleMatchesTeam(name, p.title)) continue
      // thumbnail de escudo costuma ser png/svg; rejeita fotos muito “paisagem”
      const src = p.thumbnail.source
      if (/\.jpe?g/i.test(src) && !/escudo|brasao|logo|crest/i.test(src + p.title)) {
        continue
      }
      return src
    }
  } catch {
    /* ignore */
  }
  return null
}

export function escudoConhecido(nomeAdversario: string): string | null {
  for (const c of CONHECIDOS) {
    if (c.re.test(nomeAdversario)) return c.url
  }
  return null
}

/**
 * Resolução **síncrona/rápida** para SSR (landing, /resultados).
 * Só manual + conhecidos + URL já salva no banco — sem fetch de rede.
 * O client tenta as demais candidatas (logodetimes) via onError.
 */
export function resolveEscudoRapido(
  nomeAdversario: string,
  dbUrl?: string | null,
): string | null {
  const key = normalizeKey(nomeAdversario)
  if (!key) return null
  if (cache.has(key)) return cache.get(key) ?? null

  const manual = escudoManual(nomeAdversario)
  if (manual) {
    cache.set(key, manual)
    return manual
  }

  const known = escudoConhecido(nomeAdversario)
  if (known) {
    cache.set(key, known)
    return known
  }

  // URL já persistida (ex.: sync anterior) — confia sem probe
  if (dbUrl?.trim()) {
    if (dbUrl.startsWith("/")) {
      cache.set(key, dbUrl)
      return dbUrl
    }
    const abs = normalizeEscudoUrl(dbUrl) ?? (dbUrl.startsWith("http") ? dbUrl : null)
    if (abs) {
      cache.set(key, abs)
      return abs
    }
  }

  return null
}

/**
 * Resolve com probes HTTP (logodetimes / wiki / FPFS).
 * Use em scripts/cron — **não** no render da landing (bloqueia 10s+).
 */
export async function resolveEscudoAdversario(
  nomeAdversario: string,
  fpfsUrl?: string | null,
): Promise<string | null> {
  const key = normalizeKey(nomeAdversario)
  if (!key) return null

  // Atalho: se já temos logo boa offline, não gasta rede
  const fast = resolveEscudoRapido(nomeAdversario, fpfsUrl)
  if (fast && (fast.startsWith("/") || escudoConhecido(nomeAdversario) || escudoManual(nomeAdversario))) {
    return fast
  }
  if (cache.has(key) && cache.get(key) && !String(cache.get(key)).includes("admfutsal")) {
    return cache.get(key) ?? null
  }
  // limpa cache null para permitir re-probe em scripts
  if (cache.get(key) === null) cache.delete(key)

  // 0) cadastro manual
  const manual = escudoManual(nomeAdversario)
  if (manual) {
    if (manual.startsWith("/") || (await isImageUrl(manual))) {
      cache.set(key, manual)
      return manual
    }
  }

  // 1) mapa fixo
  const known = escudoConhecido(nomeAdversario)
  if (known && (await isImageUrl(known))) {
    cache.set(key, known)
    return known
  }
  if (known) {
    // confia no mapa mesmo se o probe falhar (rede instável)
    cache.set(key, known)
    return known
  }

  // 2) logodetimes — no máx. 4 slugs (antes gerava dezenas de 404)
  for (const slug of slugCandidates(nomeAdversario).slice(0, 4)) {
    const url = `https://logodetimes.com/times/${slug}/logo-${slug}-256.png`
    if (await isImageUrl(url)) {
      cache.set(key, url)
      return url
    }
  }

  // 3) Wikipedia (estrito)
  const wiki = await wikiThumb(nomeAdversario)
  if (wiki && (await isImageUrl(wiki))) {
    cache.set(key, wiki)
    return wiki
  }

  // 4) FPFS
  const fpfs = normalizeEscudoUrl(fpfsUrl ?? null)
  if (fpfs && (await isImageUrl(fpfs))) {
    cache.set(key, fpfs)
    return fpfs
  }

  cache.set(key, null)
  return null
}

/** Lista de candidatas para o client tentar em ordem (sem probe no servidor). */
export function candidatosEscudoAdversario(
  nomeAdversario: string,
  fpfsUrl: string | null | undefined,
): string[] {
  const out: string[] = []
  const manual = escudoManual(nomeAdversario)
  if (manual) out.push(manual)
  const known = escudoConhecido(nomeAdversario)
  if (known && !out.includes(known)) out.push(known)
  const cached = cache.get(normalizeKey(nomeAdversario))
  if (cached && !out.includes(cached)) out.unshift(cached)
  // logodetimes: 2 melhores slugs — o browser tenta e falha rápido se 404
  for (const slug of slugCandidates(nomeAdversario).slice(0, 2)) {
    const url = `https://logodetimes.com/times/${slug}/logo-${slug}-256.png`
    if (!out.includes(url)) out.push(url)
  }
  const fpfs = normalizeEscudoUrl(fpfsUrl ?? null)
  // Cap 3: manter FPFS como último fallback (UI tenta em ordem)
  if (fpfs && !out.includes(fpfs)) {
    if (out.length >= 3) return [...out.slice(0, 2), fpfs]
    out.push(fpfs)
  }
  return out.slice(0, 3)
}

/** Local (`/…`) serve direto; externo passa pelo proxy. */
export function viaProxyEscudo(absoluteOrLocalUrl: string): string {
  if (absoluteOrLocalUrl.startsWith("/")) return absoluteOrLocalUrl
  return `/api/escudo?u=${encodeURIComponent(absoluteOrLocalUrl)}`
}
