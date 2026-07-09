import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { db } from "@/lib/db"
import { urlJogos } from "@/lib/fpfs/client"

export interface NoticiaCard {
  id: number
  badge: string
  titulo: string
  subtitulo: string
  resultado: "Vitoria" | "Derrota" | "Empate" | "Proximo" | "Institucional"
  href: string
  /** true = abre FPFS (sumula ou lista de jogos) em nova aba */
  externo: boolean
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
  const subtitulo = externo
    ? `${subBase} · FPFS`
    : subBase

  if (realizado) {
    const placar = `${p.golsPro} × ${p.golsContra}`
    const titulo =
      p.resultado === "Vitoria"
        ? `Vitória! Itaquerense ${placar} ${p.adversario}`
        : p.resultado === "Derrota"
          ? `Derrota para ${p.adversario}: ${placar}`
          : `Empate em ${placar} com ${p.adversario}`

    return {
      id: p.id,
      badge: p.campeonato.nome,
      titulo,
      subtitulo: p.sumulaUrl ? `${subtitulo} · ver súmula` : subtitulo,
      resultado: (p.resultado as "Vitoria" | "Derrota" | "Empate") ?? "Empate",
      href,
      externo,
    }
  }

  return {
    id: p.id,
    badge: p.campeonato.nome,
    titulo: `Próximo jogo: Itaquerense × ${p.adversario}`,
    subtitulo: externo ? `${subtitulo} · agenda FPFS` : subtitulo,
    resultado: "Proximo",
    href,
    externo,
  }
}

export type NoticiasCarrosselOpts = {
  /** Partidas já exibidas no hero — evita manchete duplicada com "Destaques". */
  excludeIds?: number[]
}

/**
 * Destaques do carrossel: próximos jogos + resultados recentes do banco
 * (preenchidos pelo sync FPFS). Links apontam para súmula/jogos no site da FPFS.
 *
 * Não repete o hero: passe `excludeIds` com a partida em destaque.
 * Sem jogos reais → lista vazia (a seção some; o hero institucional cobre a marca).
 */
export async function getNoticiasCarrossel(
  agora: Date = new Date(),
  opts: NoticiasCarrosselOpts = {},
): Promise<NoticiaCard[]> {
  const exclude = new Set(opts.excludeIds ?? [])
  const include = { campeonato: { select: { nome: true, fpfsEventoId: true } } } as const

  // Só jogos do Elite (sync marca Casa/Fora; jogos de outros times ficam Neutro)
  const nosso = { local: { in: ["Casa", "Fora"] as string[] } }

  const [proximos, recentes] = await Promise.all([
    db.partida.findMany({
      where: {
        ...nosso,
        golsPro: null,
        golsContra: null,
        data: { gte: agora },
        ...(exclude.size > 0 ? { id: { notIn: [...exclude] } } : {}),
      },
      include,
      orderBy: { data: "asc" },
      take: 4,
    }),
    db.partida.findMany({
      where: {
        ...nosso,
        golsPro: { not: null },
        golsContra: { not: null },
        ...(exclude.size > 0 ? { id: { notIn: [...exclude] } } : {}),
      },
      include,
      orderBy: { data: "desc" },
      take: 8,
    }),
  ])

  const seen = new Set<number>()
  const ordered: PartidaRow[] = []
  for (const p of [...proximos, ...recentes]) {
    if (exclude.has(p.id) || seen.has(p.id)) continue
    seen.add(p.id)
    ordered.push(p as PartidaRow)
    if (ordered.length >= 8) break
  }

  // Vazio → carrossel some (NoticiasCarrossel retorna null). Evita repetir o hero institucional.
  return ordered.map(toCard)
}
