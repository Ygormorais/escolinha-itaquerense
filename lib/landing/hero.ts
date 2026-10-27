import { format } from "date-fns"
import type { HeroDestaque } from "@/lib/landing/jogos"
import { linkPartida } from "@/lib/landing/noticias"

export interface HeroCta {
  label: string
  href: string
  externo?: boolean
}

export interface HeroSlide {
  id: string
  /** Texto curto da aba de navegação do hero. */
  aba: string
  kicker: string
  titulo: string
  descricao: string
  cta: HeroCta
  /** Foto de fundo; sem ela o slide usa o campo de listras com o escudo. */
  imagem?: string
}

export interface NoticiaHero {
  id: number
  titulo: string
  subtitulo: string | null
  categoria: string
  imagemUrl: string | null
}

export interface FaixaPartida {
  rotulo: "Próxima partida" | "Último resultado"
  campeonato: string
  adversario: string
  /** "3 × 1" (nosso placar primeiro); null enquanto o jogo não aconteceu. */
  placar: string | null
  quando: string
  local: string
  href: string
  externo: boolean
  ctaLabel: string
}

const MAX_NOTICIAS = 3

function rotuloLocal(local: string): string {
  if (local === "Casa") return "Jogo em casa"
  if (local === "Fora") return "Jogo fora"
  return local
}

/** Faixa logo abaixo do cabeçalho: próxima partida ou último resultado; sem jogos, não aparece. */
export function faixaPartida(destaque: HeroDestaque): FaixaPartida | null {
  if (destaque.tipo === "institucional") return null

  const link = linkPartida({
    sumulaUrl: destaque.sumulaUrl,
    campeonato: { fpfsEventoId: destaque.fpfsEventoId },
  })

  if (destaque.tipo === "proximo") {
    return {
      rotulo: "Próxima partida",
      campeonato: destaque.campeonato,
      adversario: destaque.adversario,
      placar: null,
      quando: format(destaque.data, "dd/MM 'às' HH:mm"),
      local: rotuloLocal(destaque.local),
      href: link.href,
      externo: link.externo,
      ctaLabel: link.externo ? "Ver na FPFS" : "Ver jogos",
    }
  }

  return {
    rotulo: "Último resultado",
    campeonato: destaque.campeonato,
    adversario: destaque.adversario,
    placar: destaque.placar,
    quando: format(destaque.data, "dd/MM/yyyy"),
    local: rotuloLocal(destaque.local),
    href: link.href,
    externo: link.externo,
    ctaLabel: link.externo ? (destaque.sumulaUrl ? "Ver súmula" : "Ver na FPFS") : "Ver resultados",
  }
}

const INSTITUCIONAL: HeroSlide = {
  id: "institucional",
  aba: "Formação de base",
  kicker: "Escolinha de futebol e futsal, desde 1922",
  titulo: "Formação de base com paixão itaquerense",
  descricao:
    "Categorias do Sub-7 ao Sub-18, competições oficiais e acompanhamento pelo portal da família. Tradição alvirrubra em Itaquera.",
  cta: { label: "Ver turmas e horários", href: "/horarios" },
}

const HISTORIA: HeroSlide = {
  id: "historia",
  aba: "Mundial 2012",
  kicker: "Nossa história",
  titulo: "Campeões mundiais Sub-13 em 2012",
  descricao:
    "O Sub-13 conquistou o mundial em Hyères, na França. Desde 1922 o clube forma atletas e cidadãos na Zona Leste.",
  cta: { label: "Conhecer a história", href: "#sobre" },
}

/**
 * Slides do hero: institucional primeiro, depois as publicações do clube (com foto, quando
 * houver) e por fim a história. Só conteúdo real do clube. A matrícula não vira slide: ela
 * já tem o botão do cabeçalho e o banner de conversão no fim da página.
 */
export function montarSlidesHero(noticias: NoticiaHero[]): HeroSlide[] {
  const publicacoes: HeroSlide[] = noticias.slice(0, MAX_NOTICIAS).map((n) => ({
    id: `noticia-${n.id}`,
    aba: n.titulo,
    kicker: n.categoria,
    titulo: n.titulo,
    descricao: n.subtitulo ?? "",
    cta: { label: "Ler publicação", href: "/noticias/publico" },
    imagem: n.imagemUrl ?? undefined,
  }))
  return [INSTITUCIONAL, ...publicacoes, HISTORIA]
}
