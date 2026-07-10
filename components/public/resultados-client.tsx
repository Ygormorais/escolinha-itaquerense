"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { CategoriaNoticias, NoticiaCard } from "@/lib/landing/noticias"
import "./resultados-client.css"

export type ClassifLinha = {
  id: number
  posicao: number
  timeNome: string
  pontos: number
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  golsPro: number
  golsContra: number
  saldo: number
  ehNosso: boolean
}

export type ClassifCamp = {
  id: number
  nome: string
  categoria: string
  status: string
  fpfsEventoId: number | null
  fpfsSyncEm: string | null
  linhas: ClassifLinha[]
}

function statusMeta(r: NoticiaCard["resultado"]): { text: string; tone: string } {
  switch (r) {
    case "Vitoria":
      return { text: "Vitória", tone: "win" }
    case "Derrota":
      return { text: "Derrota", tone: "loss" }
    case "Empate":
      return { text: "Empate", tone: "draw" }
    case "Proximo":
      return { text: "Próximo jogo", tone: "next" }
    default:
      return { text: "Clube", tone: "next" }
  }
}

function splitPlacar(placar: string | null): [string, string] | null {
  if (!placar) return null
  const parts = placar.split(/\s*[×xX\-–]\s*/)
  if (parts.length < 2) return null
  return [parts[0].trim(), parts[1].trim()]
}

function awayInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "ADV"
  )
}

function escudoSrc(url: string): string {
  if (url.startsWith("/")) return url
  return `/api/escudo?u=${encodeURIComponent(url)}`
}

function AwayCrest({ urls, name }: { urls: string[]; name: string }) {
  const [idx, setIdx] = useState(0)
  const list = urls ?? []
  const current = list[idx] ?? null

  if (!current) {
    return (
      <div className="rm-crest rm-crest-away" aria-hidden>
        <span>{awayInitials(name)}</span>
      </div>
    )
  }

  return (
    <div className="rm-crest rm-crest-photo" title={name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current}
        src={escudoSrc(current)}
        alt={`Escudo ${name}`}
        width={48}
        height={48}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  )
}

function HomeCrest() {
  return (
    <div className="rm-crest rm-crest-home">
      <Image src="/logo.png" alt="" width={48} height={48} />
    </div>
  )
}

function MatchCard({ item }: { item: NoticiaCard }) {
  const status = statusMeta(item.resultado)
  const goals = splitPlacar(item.placar)
  const casa = item.casa || "Itaquerense"
  const fora = item.fora || "Adversário"
  const nosCasa = item.nosCasa !== false
  const advEscudos = item.foraEscudos ?? []

  const leftCrest = nosCasa ? <HomeCrest /> : <AwayCrest urls={advEscudos} name={casa} />
  const rightCrest = nosCasa ? <AwayCrest urls={advEscudos} name={fora} /> : <HomeCrest />

  const body = (
    <>
      <div className="rm-bar">
        <span className="rm-comp">{item.badge}</span>
        <span className={`rm-status rm-status-${status.tone}`}>{status.text}</span>
      </div>

      <div className="rm-stage" aria-label={item.titulo}>
        <div className="rm-club">
          {leftCrest}
          <span className="rm-club-name">{casa}</span>
          <span className="rm-club-role">Casa</span>
        </div>

        <div className="rm-center">
          {goals ? (
            <div className="rm-scoreline">
              <span className="rm-goal">{goals[0]}</span>
              <span className="rm-dash" aria-hidden>
                –
              </span>
              <span className="rm-goal">{goals[1]}</span>
            </div>
          ) : (
            <div className="rm-vs">VS</div>
          )}
          <p className="rm-when">{item.subtitulo}</p>
        </div>

        <div className="rm-club">
          {rightCrest}
          <span className="rm-club-name">{fora}</span>
          <span className="rm-club-role">Visitante</span>
        </div>
      </div>

      <div className="rm-actions">
        {item.externo ? (
          <span className="rm-action">
            Ver súmula na FPFS
            <ExternalLink size={14} aria-hidden />
          </span>
        ) : (
          <span className="rm-action">Detalhes</span>
        )}
      </div>
    </>
  )

  const cls = `rm-card rm-card-${status.tone}`

  if (item.externo) {
    return (
      <a
        href={item.href}
        className={cls}
        target="_blank"
        rel="noopener noreferrer"
      >
        {body}
      </a>
    )
  }

  return (
    <Link href={item.href} className={cls}>
      {body}
    </Link>
  )
}

export function ResultadosClient({
  grupos,
  classificacoes,
  shareUrl,
}: {
  grupos: CategoriaNoticias[]
  classificacoes: ClassifCamp[]
  shareUrl: string
}) {
  const [catIdx, setCatIdx] = useState(0)
  const tabsRef = useRef<HTMLDivElement>(null)

  const gruposSafe = grupos ?? []
  const catSegura = Math.min(catIdx, Math.max(0, gruposSafe.length - 1))
  const ativo = gruposSafe[catSegura] ?? null

  const items = useMemo(() => ativo?.items ?? [], [ativo])
  const catNome = ativo?.categoria ?? ""

  const classifsCat = useMemo(
    () =>
      classificacoes.filter(
        (c) => c.categoria === catNome || (gruposSafe.length <= 1 && c.linhas.length > 0),
      ),
    [classificacoes, catNome, gruposSafe.length],
  )

  useEffect(() => {
    const root = tabsRef.current
    if (!root) return
    const active = root.querySelector<HTMLElement>(".rm-tab.active")
    if (!active) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    active.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    })
  }, [catSegura])

  if (gruposSafe.length === 0) {
    return (
      <div className="rm-empty">
        <div className="rm-empty-icon" aria-hidden>
          ·
        </div>
        <h2>Nenhum campeonato em andamento</h2>
        <p>
          Quando houver competições, os resultados e a classificação aparecerão aqui
          automaticamente.
        </p>
        <div className="rm-empty-links">
          <Link href="/horarios" className="rm-btn rm-btn-primary">
            Ver turmas e horários
          </Link>
          <Link href="/matricula" className="rm-btn rm-btn-secondary">
            Fazer pré-matrícula
          </Link>
        </div>
      </div>
    )
  }

  const proximos = items.filter((i) => i.resultado === "Proximo")
  const recentes = items.filter((i) => i.resultado !== "Proximo")
  const shareMsg = `Resultados da Escolinha Itaquerense${catNome ? ` — ${catNome}` : ""}: ${shareUrl}`
  const waHref = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`

  return (
    <div className="rm">
      {gruposSafe.length > 1 && (
        <div className="rm-tabs-bar" ref={tabsRef}>
          <div className="rm-tabs" role="tablist" aria-label="Categoria">
            {gruposSafe.map((g, i) => (
              <button
                key={g.categoria}
                type="button"
                role="tab"
                id={`rm-tab-${g.categoria}`}
                aria-selected={i === catSegura}
                aria-controls="rm-panel"
                className={"rm-tab" + (i === catSegura ? " active" : "")}
                onClick={() => setCatIdx(i)}
              >
                {g.categoria}
                <span className="rm-tab-count">{g.items.length}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        id="rm-panel"
        role="tabpanel"
        aria-labelledby={catNome ? `rm-tab-${catNome}` : undefined}
      >
        {proximos.length > 0 && (
          <section className="rm-section" aria-labelledby="rm-prox-h">
            <h2 id="rm-prox-h" className="rm-sec-lbl">
              Próximos jogos
            </h2>
            <div className="rm-list">
              {proximos.map((item) => (
                <MatchCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {recentes.length > 0 && (
          <section className="rm-section" aria-labelledby="rm-res-h">
            <h2 id="rm-res-h" className="rm-sec-lbl">
              Resultados
            </h2>
            <div className="rm-list">
              {recentes.map((item) => (
                <MatchCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}

        {items.length === 0 && (
          <p className="rm-none">Nenhum jogo nesta categoria.</p>
        )}

        {classifsCat.map((camp) =>
          camp.linhas.length === 0 ? null : (
            <section
              key={camp.id}
              className="rm-section"
              aria-labelledby={`rm-classif-${camp.id}`}
            >
              <h2 id={`rm-classif-${camp.id}`} className="rm-sec-lbl">
                Classificação
                {gruposSafe.length > 1 || classificacoes.length > 1
                  ? ` · ${camp.nome}`
                  : ""}
              </h2>
              {camp.fpfsSyncEm && (
                <p className="rm-sync">
                  Atualizado em{" "}
                  {format(new Date(camp.fpfsSyncEm), "dd/MM 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              )}
              <div className="rm-tbl-wrap">
                <table className="rm-tbl">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Time</th>
                      <th>Pts</th>
                      <th>J</th>
                      <th>V</th>
                      <th>E</th>
                      <th>D</th>
                      <th>GP</th>
                      <th>GC</th>
                      <th>SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {camp.linhas.map((l) => (
                      <tr key={l.id} className={l.ehNosso ? "nos" : undefined}>
                        <td>
                          <span className="rm-pos">{l.posicao}</span>
                        </td>
                        <td className="rm-td-name">
                          {l.ehNosso && <span className="rm-star">★</span>}
                          {l.timeNome}
                        </td>
                        <td className="rm-pts">{l.pontos}</td>
                        <td>{l.jogos}</td>
                        <td>{l.vitorias}</td>
                        <td>{l.empates}</td>
                        <td>{l.derrotas}</td>
                        <td>{l.golsPro}</td>
                        <td>{l.golsContra}</td>
                        <td>{l.saldo > 0 ? `+${l.saldo}` : l.saldo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ),
        )}

        <a href={waHref} target="_blank" rel="noopener noreferrer" className="rm-share">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.856L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.375l-.36-.214-3.727.977 1.012-3.618-.237-.376A9.818 9.818 0 1112 21.818z" />
          </svg>
          Compartilhar no WhatsApp
        </a>
      </div>
    </div>
  )
}
