import { getHeroDestaque } from "@/lib/landing/jogos"
import { faixaPartida, montarSlidesHero } from "@/lib/landing/hero"
import { getNoticiasPorCategoriaCached } from "@/lib/landing/noticias"

import { db } from "@/lib/db"
import { sobre, galeria, depoimentos } from "@/lib/landing/conteudo"
import { getConfig } from "@/lib/config"
import { LandingClient } from "@/components/landing/landing-client"
import type { NoticiaClube } from "@/components/landing/noticias-clube-carrossel"

export const metadata = { title: "Escolinha Itaquerense" }

/**
 * Rota renderiza a cada request (sem ISR/HTML estático), mas as queries de
 * jogos/notícias usam `unstable_cache` de 60s — na prática a landing segue
 * "sempre atualizada" (atraso imperceptível) com bem menos carga no banco.
 */
export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Separação de papéis (anti-redundância):
 * - Faixa sob o cabeçalho → só a próxima partida (ou último resultado), em uma linha
 * - Hero → institucional, matrícula, publicações do clube e história
 * - Carrossel → jogos/resultados com abas por categoria (Sub-7…Sub-18)
 */
export default async function Page() {
  const [jogosPorCategoria, noticiasClube, config, destaque] = await Promise.all([
    getNoticiasPorCategoriaCached(),
    db.noticia.findMany({
      where: { publicado: true },
      orderBy: [{ destaque: "desc" }, { createdAt: "desc" }],
      take: 9,
      select: { id: true, titulo: true, subtitulo: true, categoria: true, imagemUrl: true },
    }) as Promise<NoticiaClube[]>,
    getConfig(),
    getHeroDestaque(),
  ])
  return (
    <LandingClient
      jogosPorCategoria={jogosPorCategoria}
      noticiasClube={noticiasClube}
      whatsapp={config.whatsapp}
      faixa={faixaPartida(destaque)}
      slides={montarSlidesHero(noticiasClube)}
      sobre={sobre}
      galeria={galeria}
      depoimentos={depoimentos}
      endereco={config.endereco}
      cidade={config.cidade}
    />
  )
}
