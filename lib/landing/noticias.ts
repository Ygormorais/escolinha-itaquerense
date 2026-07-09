import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { db } from "@/lib/db"
import { urlJogos } from "@/lib/fpfs/client"
import {
  candidatosEscudoAdversario,
  resolveEscudoRapido,
} from "@/lib/landing/escudo-adversario"
import { categoriaCurta, nomeTime } from "@/lib/landing/times"

// Re-export para imports legados (server-only modules). Client Components devem
// importar de @/lib/landing/times para não puxar Prisma/better-sqlite3.
export { categoriaCurta, nomeTime } from "@/lib/landing/times"

export interface NoticiaCard {
  id: number
  badge: string
  /** Linha acessível / legada (manchete em uma frase) */
  titulo: string
  subtitulo: string
  resultado: "Vitoria" | "Derrota" | "Empate" | "Proximo" | "Institucional"
  href: string
  /** true = abre FPFS (sumula ou lista de jogos) em nova aba */
  externo: boolean
  /**
   * Layout placar no sentido do mando de campo:
   * casa = time da casa (esquerda), fora = visitante (direita).
   * Quando jogamos fora, adversário fica à esquerda.
   */
  casa: string
  fora: string
  /** true se o Itaquerense é o time da casa (esquerda) */
  nosCasa: boolean
  /** "7 × 4" no sentido casa × fora; null = ainda sem placar */
  placar: string | null
  /**
   * URLs candidatas de escudo do adversário (não do Itaquerense).
   * O UI tenta em ordem via /api/escudo; se todas falharem → monograma.
   */
  foraEscudos: string[]
}

const FPFS_HOSTS = new Set(["admfutsal.com.br", "eventos.admfutsal.com.br"])

/** Normaliza URL da FPFS (súmula relativa ou absoluta) e bloqueia hosts estranhos. */
export function resolveFpfsUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  try {
    const u = new URL(raw.trim(), "https://eventos.admfutsal.com.br")
    const host = u.hostname.replace(/^www\./, "").toLowerCase()
    if (!FPFS_HOSTS.has(host)) return null
    u.protocol = "https:"
    return u.toString()
  } catch {
    return null
  }
}

/**
 * Link real do card:
 * 1) súmula do jogo na FPFS (quando o sync trouxe sumulaUrl)
 * 2) página de jogos do evento FPFS do campeonato
 * 3) fallback interno /resultados
 */
export function linkPartida(p: {
  sumulaUrl: string | null
  campeonato: { fpfsEventoId: number | null }
}): { href: string; externo: boolean } {
  const sumula = resolveFpfsUrl(p.sumulaUrl)
  if (sumula) return { href: sumula, externo: true }
  if (p.campeonato.fpfsEventoId != null) {
    return { href: urlJogos(p.campeonato.fpfsEventoId), externo: true }
  }
  return { href: "/resultados", externo: false }
}

function localLabel(local: string): string {
  if (local === "Casa") return "Jogo em casa"
  if (local === "Fora") return "Jogo fora"
  return local
}

type PartidaRow = {
  id: number
  adversario: string
  adversarioEscudoUrl: string | null
  local: string
  data: Date
  golsPro: number | null
  golsContra: number | null
  resultado: string | null
  sumulaUrl: string | null
  campeonato: { nome: string; fpfsEventoId: number | null }
}

function toCard(p: PartidaRow): NoticiaCard {
  const realizado = p.golsPro != null && p.golsContra != null
  const data = format(new Date(p.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const { href, externo } = linkPartida(p)
  const subBase = `${data} · ${localLabel(p.local)}`
  const subtitulo = externo ? `${subBase} · FPFS` : subBase
  const adversario = nomeTime(p.adversario)
  // Neutro e Casa → Itaquerense à esquerda; Fora → adversário manda
  const nosCasa = p.local !== "Fora"
  const casa = nosCasa ? "Itaquerense" : adversario
  const fora = nosCasa ? adversario : "Itaquerense"
  const foraEscudos = candidatosEscudoAdversario(p.adversario, p.adversarioEscudoUrl)

  if (realizado) {
    // placar no sentido do mando: casa × visitante
    const placar = nosCasa
      ? `${p.golsPro} × ${p.golsContra}`
      : `${p.golsContra} × ${p.golsPro}`
    const titulo =
      p.resultado === "Vitoria"
        ? `Vitória! Itaquerense ${p.golsPro} × ${p.golsContra} ${adversario}`
        : p.resultado === "Derrota"
          ? `Derrota para ${adversario}: ${p.golsPro} × ${p.golsContra}`
          : `Empate em ${p.golsPro} × ${p.golsContra} com ${adversario}`

    return {
      id: p.id,
      badge: p.campeonato.nome,
      titulo,
      subtitulo: p.sumulaUrl ? `${subtitulo} · ver súmula` : subtitulo,
      resultado: (p.resultado as "Vitoria" | "Derrota" | "Empate") ?? "Empate",
      href,
      externo,
      casa,
      fora,
      nosCasa,
      placar,
      foraEscudos,
    }
  }

  return {
    id: p.id,
    badge: p.campeonato.nome,
    titulo: `Próximo jogo: Itaquerense × ${adversario}`,
    subtitulo: externo ? `${subtitulo} · agenda FPFS` : subtitulo,
    resultado: "Proximo",
    href,
    externo,
    casa,
    fora,
    nosCasa,
    placar: null,
    foraEscudos,
  }
}

export type NoticiasCarrosselOpts = {
  /** Partidas já exibidas no hero — evita manchete duplicada com "Destaques". */
  excludeIds?: number[]
  /** Máx. de cards por categoria (próximos + resultados). */
  porCategoria?: number
}

export interface CategoriaNoticias {
  /** Rótulo curto: Sub-18, Sub-12… */
  categoria: string
  items: NoticiaCard[]
}

function sortCategorias(a: string, b: string): number {
  const na = Number(a.match(/Sub-(\d+)/i)?.[1])
  const nb = Number(b.match(/Sub-(\d+)/i)?.[1])
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
  return a.localeCompare(b, "pt-BR")
}

/**
 * Jogos/resultados agrupados por categoria (Sub-7…Sub-18).
 * Cada aba tem próximos (asc) + recentes (desc), sem misturar categorias.
 */
export async function getNoticiasPorCategoria(
  agora: Date = new Date(),
  opts: NoticiasCarrosselOpts = {},
): Promise<CategoriaNoticias[]> {
  const exclude = new Set(opts.excludeIds ?? [])
  const limit = opts.porCategoria ?? 8
  const include = { campeonato: { select: { nome: true, fpfsEventoId: true } } } as const
  const nosso = { local: { in: ["Casa", "Fora"] as string[] } }
  // Temporada atual + anterior: em 2026 a FPFS só tem Sub-7..10;
  // Sub-12+ vêm da temporada 2025 até o Elite registrar as demais.
  const ano = agora.getFullYear()
  const inicioTemporada = new Date(ano - 1, 0, 1)
  const campAtivo = { campeonato: { status: { not: "encerrado" } } }

  // Volume alto por categoria: take global era monopolizado por um Sub.
  const [proximos, recentes] = await Promise.all([
    db.partida.findMany({
      where: {
        ...nosso,
        ...campAtivo,
        golsPro: null,
        golsContra: null,
        data: { gte: agora },
        ...(exclude.size > 0 ? { id: { notIn: [...exclude] } } : {}),
      },
      include,
      orderBy: { data: "asc" },
      take: 200,
    }),
    db.partida.findMany({
      where: {
        ...nosso,
        ...campAtivo,
        golsPro: { not: null },
        golsContra: { not: null },
        data: { gte: inicioTemporada },
        ...(exclude.size > 0 ? { id: { notIn: [...exclude] } } : {}),
      },
      include,
      orderBy: { data: "desc" },
      take: 400,
    }),
  ])

  type Bucket = { proximos: PartidaRow[]; recentes: PartidaRow[]; seen: Set<number> }
  const buckets = new Map<string, Bucket>()

  function bucket(nome: string): Bucket {
    const key = categoriaCurta(nome)
    let b = buckets.get(key)
    if (!b) {
      b = { proximos: [], recentes: [], seen: new Set() }
      buckets.set(key, b)
    }
    return b
  }

  for (const p of proximos as PartidaRow[]) {
    if (exclude.has(p.id)) continue
    const b = bucket(p.campeonato.nome)
    if (b.seen.has(p.id)) continue
    b.seen.add(p.id)
    b.proximos.push(p)
  }
  for (const p of recentes as PartidaRow[]) {
    if (exclude.has(p.id)) continue
    const b = bucket(p.campeonato.nome)
    if (b.seen.has(p.id)) continue
    b.seen.add(p.id)
    b.recentes.push(p)
  }

  // Escudos: só resolução rápida no SSR (manual/conhecido/DB).
  // Rede (logodetimes/wiki) fica para scripts — não bloquear a landing.
  const allPartidas = [...buckets.values()].flatMap((b) => [...b.proximos, ...b.recentes])
  const nomes = [...new Set(allPartidas.map((p) => p.adversario))]
  const escudoPorNome = new Map<string, string | null>()
  for (const nome of nomes) {
    const sample = allPartidas.find((p) => p.adversario === nome)
    escudoPorNome.set(nome, resolveEscudoRapido(nome, sample?.adversarioEscudoUrl))
  }

  const grupos: CategoriaNoticias[] = []
  for (const cat of [...buckets.keys()].sort(sortCategorias)) {
    const b = buckets.get(cat)!
    const ordered = [...b.proximos, ...b.recentes].slice(0, limit)
    if (ordered.length === 0) continue
    grupos.push({
      categoria: cat,
      items: ordered.map((p) => {
        const card = toCard(p)
        const resolved = escudoPorNome.get(p.adversario)
        const foraEscudos = resolved
          ? [resolved, ...card.foraEscudos.filter((u) => u !== resolved)]
          : card.foraEscudos
        return { ...card, badge: cat, foraEscudos }
      }),
    })
  }
  return grupos
}

/**
 * Lista plana (legado / testes): junta todas as categorias.
 * Preferir `getNoticiasPorCategoria` na landing.
 */
export async function getNoticiasCarrossel(
  agora: Date = new Date(),
  opts: NoticiasCarrosselOpts = {},
): Promise<NoticiaCard[]> {
  const grupos = await getNoticiasPorCategoria(agora, opts)
  return grupos.flatMap((g) => g.items)
}
