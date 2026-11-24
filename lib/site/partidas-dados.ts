import { unstable_cache } from "next/cache"
import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { candidatosEscudoAdversario, resolveEscudoRapido } from "@/lib/landing/escudo-adversario"
import { linkPartida, resolveFpfsUrl } from "@/lib/landing/noticias"
import { categoriaCurta, nomeTime } from "@/lib/landing/times"
import { nomeCompeticao, type PartidaLinha, type ResultadoPartida } from "./partidas"

type PartidaDoBanco = Awaited<ReturnType<typeof buscarPartidas>>[number]

function buscarPartidas(where: Prisma.PartidaWhereInput, take: number) {
  return db.partida.findMany({
    where,
    include: { campeonato: { select: { nome: true, fpfsEventoId: true } } },
    orderBy: { data: "desc" },
    take,
  })
}

function paraLinha(p: PartidaDoBanco, agora: Date): PartidaLinha {
  const adversario = nomeTime(p.adversario)
  const nosCasa = p.local !== "Fora"
  const realizado = p.golsPro != null && p.golsContra != null
  const placar: [number, number] | null = realizado
    ? nosCasa
      ? [p.golsPro!, p.golsContra!]
      : [p.golsContra!, p.golsPro!]
    : null
  const resultado: ResultadoPartida = realizado
    ? ((p.resultado as ResultadoPartida | null) ?? "Empate")
    : p.data.getTime() >= agora.getTime()
      ? "Proximo"
      : "SemPlacar"
  const rapido = resolveEscudoRapido(p.adversario, p.adversarioEscudoUrl)
  const candidatos = candidatosEscudoAdversario(p.adversario, p.adversarioEscudoUrl)
  const { href, externo } = linkPartida(p)
  return {
    id: p.id,
    data: p.data.toISOString(),
    categoria: categoriaCurta(p.campeonato.nome),
    competicao: nomeCompeticao(p.campeonato.nome, p.campeonato.fpfsEventoId),
    local: p.local,
    nosCasa,
    casa: nosCasa ? "Itaquerense" : adversario,
    fora: nosCasa ? adversario : "Itaquerense",
    placar,
    resultado,
    escudosAdversario: (rapido ? [rapido, ...candidatos.filter((u) => u !== rapido)] : candidatos).slice(0, 3),
    href,
    externo,
    temSumula: resolveFpfsUrl(p.sumulaUrl) != null,
  }
}

/**
 * Partidas do clube na temporada atual e na anterior (mesma janela da landing),
 * já no formato da página pública. Filtro e paginação ficam em lib/site/partidas.
 */
export async function getPartidasPublicas(agora: Date = new Date()): Promise<PartidaLinha[]> {
  const inicioTemporada = new Date(agora.getFullYear() - 1, 0, 1)
  const partidas = await buscarPartidas({ local: { in: ["Casa", "Fora"] }, data: { gte: inicioTemporada } }, 1500)

  return partidas.map((p) => paraLinha(p, agora))
}

/**
 * Uma partida FINALIZADA do clube (jogo em casa ou fora, com placar completo) para a página e o
 * cartão compartilhável. Jogo futuro, sem placar ou neutro/inexistente devolve null (404).
 */
export async function getPartidaFinalizadaPublica(id: number, agora: Date = new Date()): Promise<PartidaLinha | null> {
  const [p] = await buscarPartidas({ id, local: { in: ["Casa", "Fora"] }, golsPro: { not: null }, golsContra: { not: null } }, 1)
  return p ? paraLinha(p, agora) : null
}

/** Cache de 60s com chave fixa, mesma tag dos jogos da landing (revalidada pelo sync FPFS). */
export const getPartidasPublicasCached = unstable_cache(
  () => getPartidasPublicas(new Date()),
  ["site-partidas-publicas"],
  { revalidate: 60, tags: ["landing-jogos"] },
)
