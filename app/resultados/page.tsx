import Link from "next/link"
import { publicFontClass } from "@/lib/public-fonts"
import { pubBase, PUB_HDR_CSS } from "@/lib/public-css"
import { PublicHeader } from "@/components/public/public-header"
import {
  ResultadosClient,
  type ClassifCamp,
} from "@/components/public/resultados-client"
import {
  categoriaCurta,
  getNoticiasPorCategoria,
} from "@/lib/landing/noticias"
import { db } from "@/lib/db"

/** Sempre dados frescos da FPFS (sem cache estático). */
export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Resultados — E.C. Itaquerense",
  description:
    "Resultados, classificação e próximos jogos da Escolinha de Futsal E.C. Itaquerense.",
}

const css = `
  ${pubBase("res")}
  ${PUB_HDR_CSS}
  .res .pub-hdr .inner{max-width:900px}

  .res-hero{
    border-bottom:1px solid var(--border);
    padding:44px 24px 36px;
    background:linear-gradient(180deg,rgba(74,11,11,.05) 0%,transparent 100%)
  }
  .res-hero .inner{max-width:900px;margin:0 auto}
  .res-hero h1{
    font-family:var(--font-heading),Georgia,serif;font-size:38px;
    font-weight:800;letter-spacing:-1px;color:var(--text);margin-bottom:6px
  }
  .res-hero p{font-size:15px;color:var(--text-muted)}

  .res-body{max-width:900px;margin:0 auto;padding:36px 24px 88px}

  .res-ftr{border-top:1px solid var(--border);padding:28px 24px}
  .res-ftr .inner{
    max-width:900px;margin:0 auto;
    display:flex;justify-content:center;gap:28px;flex-wrap:wrap
  }
  .res-ftr a{font-size:13px;font-weight:600;color:var(--red);opacity:.8;transition:opacity .2s}
  .res-ftr a:hover{opacity:1}

  @media(max-width:640px){
    .res-hero{padding:32px 16px 28px}
    .res-hero h1{font-size:28px}
    .res-body{padding:24px 16px 64px}
  }
`

export default async function ResultadosPage() {
  const ano = new Date().getFullYear()
  // Mesma janela da landing: ano atual + anterior (todas as categorias Elite)
  const inicioTemporada = new Date(ano - 1, 0, 1)

  const [grupos, campeonatos] = await Promise.all([
    getNoticiasPorCategoria(new Date(), { porCategoria: 60 }),
    db.campeonato.findMany({
      where: {
        status: { not: "encerrado" },
        OR: [
          { partidas: { some: { data: { gte: inicioTemporada }, local: { in: ["Casa", "Fora"] } } } },
          { classificacaoFpfs: { some: {} }, dataInicio: { gte: inicioTemporada } },
        ],
      },
      include: {
        classificacaoFpfs: {
          orderBy: [{ fase: "asc" }, { posicao: "asc" }],
        },
      },
      orderBy: { dataInicio: "desc" },
    }),
  ])

  const classificacoes: ClassifCamp[] = campeonatos.map((c) => ({
    id: c.id,
    nome: c.nome,
    categoria: categoriaCurta(c.nome),
    status: c.status,
    fpfsEventoId: c.fpfsEventoId,
    fpfsSyncEm: c.fpfsSyncEm ? c.fpfsSyncEm.toISOString() : null,
    linhas: c.classificacaoFpfs.map((l) => ({
      id: l.id,
      posicao: l.posicao,
      timeNome: l.timeNome,
      pontos: l.pontos,
      jogos: l.jogos,
      vitorias: l.vitorias,
      empates: l.empates,
      derrotas: l.derrotas,
      golsPro: l.golsPro,
      golsContra: l.golsContra,
      saldo: l.saldo,
      ehNosso: l.ehNosso,
    })),
  }))

  // Categorias só de classificação (sem jogos no carrossel) ainda entram nas abas
  const catsFromClassif = new Set(
    classificacoes.filter((c) => c.linhas.length > 0).map((c) => c.categoria),
  )
  const catsFromJogos = new Set(grupos.map((g) => g.categoria))
  const extraCats = [...catsFromClassif].filter((c) => !catsFromJogos.has(c))
  const gruposFull =
    extraCats.length === 0
      ? grupos
      : [
          ...grupos,
          ...extraCats
            .sort((a, b) => {
              const na = Number(a.match(/Sub-(\d+)/i)?.[1])
              const nb = Number(b.match(/Sub-(\d+)/i)?.[1])
              if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb
              return a.localeCompare(b, "pt-BR")
            })
            .map((categoria) => ({ categoria, items: [] })),
        ]

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  return (
    <div className={`res ${publicFontClass}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <PublicHeader subtitle="Resultados & Classificação" />

      <div className="res-hero">
        <div className="inner">
          <h1>Jogos &amp; Classificação</h1>
          <p>
            Resultados, próximos jogos e tabela de classificação da Escolinha
            Itaquerense — filtrados por categoria.
          </p>
        </div>
      </div>

      <div className="res-body">
        <ResultadosClient
          grupos={gruposFull}
          classificacoes={classificacoes}
          shareUrl={`${appUrl}/resultados`}
        />
      </div>

      <footer className="res-ftr">
        <div className="inner">
          <Link href="/responsavel">Portal do Responsável</Link>
          <Link href="/matricula">Pré-Matrícula</Link>
          <Link href="/">← Voltar ao site</Link>
        </div>
      </footer>
    </div>
  )
}
