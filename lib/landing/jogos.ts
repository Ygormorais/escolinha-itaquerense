import { format } from "date-fns"
import { db } from "@/lib/db"
import { linkPartida } from "@/lib/landing/noticias"

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
  | {
      tipo: "proximo"
      /** id da partida — usado para não repetir o mesmo jogo no carrossel Destaques */
      id: number
      adversario: string
      data: Date
      local: string
      campeonato: string
      sumulaUrl: string | null
      fpfsEventoId: number | null
    }
  | {
      tipo: "resultado"
      id: number
      adversario: string
      data: Date
      local: string
      campeonato: string
      placar: string
      resultado: string | null
      sumulaUrl: string | null
      fpfsEventoId: number | null
    }
  | { tipo: "institucional" }

export interface HeroView {
  badge: string
  titulo: string
  descricao: string
  ctaHref: string
  ctaLabel: string
  ctaExterno?: boolean
}

/** Destaque do hero: próxima partida agendada; senão último resultado; senão institucional. */
export async function getHeroDestaque(agora: Date = new Date()): Promise<HeroDestaque> {
  const partidaSelect = {
    id: true,
    adversario: true, local: true, data: true,
    golsPro: true, golsContra: true, resultado: true, sumulaUrl: true,
    campeonato: { select: { nome: true, fpfsEventoId: true } },
  } as const

  const nosso = { local: { in: ["Casa", "Fora"] as string[] } }

  // Próximo = ainda sem placar (não usar só data: FPFS manda dia/mês sem ano)
  const proxima = await db.partida.findFirst({
    where: {
      ...nosso,
      golsPro: null,
      golsContra: null,
      data: { gte: agora },
    },
    orderBy: { data: "asc" },
    select: partidaSelect,
  })
  if (proxima) {
    return {
      tipo: "proximo",
      id: proxima.id,
      adversario: proxima.adversario,
      data: proxima.data,
      local: proxima.local,
      campeonato: proxima.campeonato.nome,
      sumulaUrl: proxima.sumulaUrl,
      fpfsEventoId: proxima.campeonato.fpfsEventoId,
    }
  }

  const ultima = await db.partida.findFirst({
    where: {
      golsPro: { not: null },
      golsContra: { not: null },
      ...nosso,
    },
    orderBy: { data: "desc" },
    select: partidaSelect,
  })
  if (ultima) {
    return {
      tipo: "resultado",
      id: ultima.id,
      adversario: ultima.adversario,
      data: ultima.data,
      local: ultima.local,
      campeonato: ultima.campeonato.nome,
      placar: `${ultima.golsPro} × ${ultima.golsContra}`,
      resultado: ultima.resultado,
      sumulaUrl: ultima.sumulaUrl,
      fpfsEventoId: ultima.campeonato.fpfsEventoId,
    }
  }

  return { tipo: "institucional" }
}

/** Id da partida em destaque no hero (para o carrossel não repetir). */
export function heroPartidaId(destaque: HeroDestaque): number | null {
  if (destaque.tipo === "institucional") return null
  return destaque.id
}

/** Copy do hero decidida no servidor — o client só renderiza. */
export function heroView(destaque: HeroDestaque): HeroView {
  if (destaque.tipo === "proximo") {
    const link = linkPartida({
      sumulaUrl: destaque.sumulaUrl,
      campeonato: { fpfsEventoId: destaque.fpfsEventoId },
    })
    return {
      badge: destaque.campeonato,
      titulo: `Próximo desafio: Itaquerense × ${destaque.adversario}`,
      descricao: `${format(destaque.data, "dd/MM 'às' HH:mm")} · ${destaque.local}. Venha apoiar a garotada do E.C. Itaquerense.`,
      ctaHref: link.href,
      ctaLabel: link.externo ? "Ver na FPFS" : "Ver jogos",
      ctaExterno: link.externo,
    }
  }
  if (destaque.tipo === "resultado") {
    const titulo =
      destaque.resultado === "Vitoria"
        ? `Itaquerense vence ${destaque.adversario} por ${destaque.placar}`
        : destaque.resultado === "Empate"
          ? `Itaquerense empata com ${destaque.adversario} em ${destaque.placar}`
          : `Itaquerense ${destaque.placar} ${destaque.adversario}`
    const link = linkPartida({
      sumulaUrl: destaque.sumulaUrl,
      campeonato: { fpfsEventoId: destaque.fpfsEventoId },
    })
    return {
      badge: destaque.campeonato,
      titulo,
      descricao: `Jogo disputado em ${format(destaque.data, "dd/MM/yyyy")} · ${destaque.local}. Confira a súmula e os resultados na FPFS.`,
      ctaHref: link.href,
      ctaLabel: link.externo ? (destaque.sumulaUrl ? "Ver súmula FPFS" : "Ver na FPFS") : "Ver resultados",
      ctaExterno: link.externo,
    }
  }
  // CTA de descoberta (turmas). Matrícula fica no CTA de conversão no fim da página.
  return {
    badge: "Escolinha de Futebol e Futsal · desde 1922",
    titulo: "Formação de base com paixão itaquerense",
    descricao: "Categorias do Sub-7 ao Sub-18, competições oficiais e acompanhamento pelo portal da família. Tradição alvirrubra em Itaquera.",
    ctaHref: "/horarios",
    ctaLabel: "Ver turmas e horários",
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
