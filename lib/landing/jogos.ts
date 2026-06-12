import { format } from "date-fns"
import { db } from "@/lib/db"

export interface JogoLanding {
  adversario: string
  local: string
  data: Date
  placar: string | null
  realizado: boolean
  resultado: string | null
  sumulaUrl: string | null
}

export interface CategoriaJogos {
  categoria: string
  jogos: JogoLanding[]
}

export type HeroDestaque =
  | { tipo: "proximo"; adversario: string; data: Date; local: string; campeonato: string }
  | { tipo: "resultado"; adversario: string; data: Date; local: string; campeonato: string; placar: string; resultado: string | null }
  | { tipo: "institucional" }

export interface HeroView {
  badge: string
  titulo: string
  descricao: string
  ctaHref: string
  ctaLabel: string
}

/** Destaque do hero: próxima partida agendada; senão último resultado; senão institucional. */
export async function getHeroDestaque(agora: Date = new Date()): Promise<HeroDestaque> {
  const partidaSelect = {
    adversario: true, local: true, data: true,
    golsPro: true, golsContra: true, resultado: true,
    campeonato: { select: { nome: true } },
  } as const

  const proxima = await db.partida.findFirst({
    where: { data: { gte: agora } },
    orderBy: { data: "asc" },
    select: partidaSelect,
  })
  if (proxima) {
    return {
      tipo: "proximo",
      adversario: proxima.adversario,
      data: proxima.data,
      local: proxima.local,
      campeonato: proxima.campeonato.nome,
    }
  }

  const ultima = await db.partida.findFirst({
    where: { golsPro: { not: null }, golsContra: { not: null } },
    orderBy: { data: "desc" },
    select: partidaSelect,
  })
  if (ultima) {
    return {
      tipo: "resultado",
      adversario: ultima.adversario,
      data: ultima.data,
      local: ultima.local,
      campeonato: ultima.campeonato.nome,
      placar: `${ultima.golsPro} × ${ultima.golsContra}`,
      resultado: ultima.resultado,
    }
  }

  return { tipo: "institucional" }
}

/** Copy do hero decidida no servidor — o client só renderiza. */
export function heroView(destaque: HeroDestaque): HeroView {
  if (destaque.tipo === "proximo") {
    return {
      badge: destaque.campeonato,
      titulo: `Próximo desafio: Itaquerense × ${destaque.adversario}`,
      descricao: `${format(destaque.data, "dd/MM 'às' HH:mm")} · ${destaque.local}. Venha apoiar a garotada do E.C. Itaquerense.`,
      ctaHref: "#jogos",
      ctaLabel: "Ver jogos",
    }
  }
  if (destaque.tipo === "resultado") {
    const titulo =
      destaque.resultado === "Vitoria"
        ? `Itaquerense vence ${destaque.adversario} por ${destaque.placar}`
        : destaque.resultado === "Empate"
          ? `Itaquerense empata com ${destaque.adversario} em ${destaque.placar}`
          : `Itaquerense ${destaque.placar} ${destaque.adversario}`
    return {
      badge: destaque.campeonato,
      titulo,
      descricao: `Jogo disputado em ${format(destaque.data, "dd/MM/yyyy")} · ${destaque.local}. Confira todos os resultados das nossas categorias.`,
      ctaHref: "#jogos",
      ctaLabel: "Ver jogos",
    }
  }
  return {
    badge: "Escolinha de Futebol e Futsal",
    titulo: "Formação de base com paixão itaquerense",
    descricao: "Treinos para todas as categorias, jogos oficiais e acompanhamento completo pelo portal do responsável. Venha fazer parte da nossa história.",
    ctaHref: "/matricula",
    ctaLabel: "Fazer Matrícula",
  }
}

export async function getJogosPorCategoria(): Promise<CategoriaJogos[]> {
  const campeonatos = await db.campeonato.findMany({
    where: { fpfsEventoId: { not: null } },
    include: { partidas: { orderBy: { data: "asc" } } },
    orderBy: { dataInicio: "desc" },
  })

  return campeonatos
    .filter((c) => c.partidas.length > 0)
    .map((c) => ({
      categoria: c.nome,
      jogos: c.partidas.map((p) => {
        const realizado = p.golsPro != null && p.golsContra != null
        return {
          adversario: p.adversario,
          local: p.local,
          data: p.data,
          placar: realizado ? `${p.golsPro} × ${p.golsContra}` : null,
          realizado,
          resultado: p.resultado,
          sumulaUrl: p.sumulaUrl,
        }
      }),
    }))
}
