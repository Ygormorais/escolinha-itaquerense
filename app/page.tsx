import { getHeroDestaque } from "@/lib/landing/jogos"
import { faixaPartida, montarSlidesHero } from "@/lib/landing/hero"
import { getNoticiasPorCategoriaCached } from "@/lib/landing/noticias"

import { db } from "@/lib/db"
import { sobre, galeria, depoimentos } from "@/lib/landing/conteudo"
import { getConfig } from "@/lib/config"
import { getAnuncio } from "@/lib/site/anuncios-dados"
import type { Metadata } from "next"
import { metadataPublica } from "@/lib/site/seo"
import { montarJsonLdClube, serializarJsonLd } from "@/lib/site/jsonld"
import { LandingClient } from "@/components/landing/landing-client"
import type { NoticiaClube } from "@/components/landing/noticias-clube-carrossel"

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export const metadata: Metadata = {
  ...metadataPublica({
    title: "Escolinha de Futsal em Itaquera, SP",
    description:
      "Escolinha de futsal do E.C. Itaquerense em Itaquera, zona leste de São Paulo: turmas por idade, horários, resultados e pré-matrícula online.",
    path: "/",
  }),
  // A home não leva o sufixo do template: o título já traz o nome do clube.
  title: { absolute: "Escolinha de Futsal em Itaquera, SP — E.C. Itaquerense" },
}

/**
 * Rota renderiza a cada request: o layout raiz lê o cookie de sessão (para o shell
 * do admin), o que torna toda página dinâmica; revalidate não teria efeito. A carga
 * no banco é contida pelas queries de jogos/notícias com `unstable_cache` de 60s.
 */
export const dynamic = "force-dynamic"

/**
 * Separação de papéis (anti-redundância):
 * - Faixa sob o cabeçalho → só a próxima partida (ou último resultado), em uma linha
 * - Hero → institucional, matrícula, publicações do clube e história
 * - Carrossel → jogos/resultados com abas por categoria (Sub-7…Sub-18)
 */
export default async function Page() {
  const [jogosPorCategoria, noticiasClube, config, destaque, anuncio] = await Promise.all([
    getNoticiasPorCategoriaCached(),
    db.noticia.findMany({
      where: { publicado: true },
      orderBy: [{ destaque: "desc" }, { createdAt: "desc" }],
      take: 9,
      select: { id: true, titulo: true, subtitulo: true, categoria: true, imagemUrl: true, slug: true },
    }) as Promise<NoticiaClube[]>,
    getConfig(),
    getHeroDestaque(),
    getAnuncio("landing"),
  ])
  return (
    <>
      {/* Dados estruturados do clube: só na home (não nas páginas privadas). */}
      <script
        id="site-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializarJsonLd(montarJsonLdClube(config, baseUrl)) }}
      />
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
      contato={{
        latitude: config.latitude,
        longitude: config.longitude,
        instagram: config.instagram,
        facebook: config.facebook,
        youtube: config.youtube,
      }}
      anuncio={anuncio}
    />
    </>
  )
}
