import { db } from "@/lib/db"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"
import { inter, playfair } from "@/lib/public-fonts"
import { pubBase, PUB_HDR_CSS } from "@/lib/public-css"
import { PublicHeader } from "@/components/public/public-header"

export const metadata = {
  title: "Resultados — E.C. Itaquerense",
  description: "Resultados, classificação e próximos jogos da Escolinha de Futsal E.C. Itaquerense.",
}

const css = `
  ${pubBase("res")}
  ${PUB_HDR_CSS}
  .res .pub-hdr .inner{max-width:900px}

  /* ── HERO ── */
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

  /* ── BODY ── */
  .res-body{max-width:900px;margin:0 auto;padding:44px 24px 88px}

  /* ── CAMP BLOCK ── */
  .res-camp{margin-bottom:56px}
  .res-camp+.res-camp{border-top:2px solid var(--border);padding-top:48px}
  .res-camp-hdr{display:flex;align-items:flex-start;gap:14px;margin-bottom:28px}
  .res-camp-icon{
    width:46px;height:46px;background:var(--red);border-radius:10px;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
    box-shadow:0 4px 12px rgba(198,40,40,.3)
  }
  .res-camp-icon svg{width:22px;height:22px}
  .res-camp-name{
    font-family:var(--font-heading),Georgia,serif;font-size:24px;
    font-weight:800;color:var(--text);line-height:1.2
  }
  .res-camp-meta{display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap}
  .res-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 0 28px}
  .res-kpi{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px 18px;box-shadow:0 1px 4px rgba(26,26,46,.05)}
  .res-kpi .lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:var(--text-muted);margin-bottom:6px}
  .res-kpi .val{font-family:var(--font-heading),Georgia,serif;font-size:28px;font-weight:800;line-height:1;color:var(--text)}
  .res-kpi .sub{font-size:12px;color:var(--text-muted);margin-top:6px}

  /* badges */
  .bdg{display:inline-flex;align-items:center;font-size:10px;font-weight:700;
    text-transform:uppercase;letter-spacing:.8px;padding:3px 9px;border-radius:100px}
  .bdg-status{background:#FEF9C3;color:#854D0E}
  .bdg-fpfs{background:#E3F2FD;color:#1565C0}
  .bdg-sync{font-size:11px;font-weight:400;color:var(--text-muted);padding:0}

  /* ── SECTION LABEL ── */
  .sec-lbl{
    font-size:10px;font-weight:700;text-transform:uppercase;
    letter-spacing:1.8px;color:var(--text-muted);
    margin-bottom:14px;padding-left:2px;display:flex;align-items:center;gap:8px
  }
  .sec-lbl::after{content:'';flex:1;height:1px;background:var(--border)}

  /* ── PRÓXIMO JOGO DESTAQUE ── */
  .res-proximo{
    background:linear-gradient(135deg,var(--red-deep) 0%,var(--red) 100%);
    color:#fff;border-radius:16px;padding:22px 24px;margin-bottom:32px;
    display:flex;align-items:center;gap:20px;
    box-shadow:0 8px 24px rgba(198,40,40,.25)
  }
  .res-proximo .prox-body{flex:1;min-width:0}
  .prox-pill{
    font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
    background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);
    border-radius:100px;padding:4px 12px;display:inline-block;margin-bottom:10px
  }
  .prox-match{
    font-family:var(--font-heading),Georgia,serif;font-size:24px;
    font-weight:800;letter-spacing:-.5px;margin-bottom:6px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis
  }
  .prox-meta{font-size:12px;opacity:.78;line-height:1.5}
  .prox-logo{flex-shrink:0;opacity:.2}

  /* ── RESULT CARDS ── */
  .res-cards{display:flex;flex-direction:column;gap:10px;margin-bottom:32px}
  .res-card{
    background:#fff;border:1px solid var(--border);border-radius:12px;
    display:flex;align-items:center;gap:14px;padding:14px 18px;
    box-shadow:0 1px 4px rgba(26,26,46,.05);transition:box-shadow .2s
  }
  .res-card:hover{box-shadow:0 4px 16px rgba(26,26,46,.08)}
  .res-rbadge{
    width:36px;height:36px;border-radius:9px;
    display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:13px;flex-shrink:0
  }
  .rbv{background:#E8F5E9;color:#1B5E20}
  .rbe{background:#F3F4F6;color:#4B5563}
  .rbd{background:#FFEBEE;color:#B71C1C}
  .res-card-info{flex:1;min-width:0}
  .res-card-info .adv{font-weight:700;font-size:15px;color:var(--text)}
  .res-card-info .meta{font-size:12px;color:var(--text-muted);margin-top:3px}
  .sumula-lnk{color:var(--red);font-weight:700}
  .res-card-score{text-align:right;flex-shrink:0}
  .res-card-score .score-num{
    font-family:var(--font-heading),Georgia,serif;
    font-size:24px;font-weight:800;letter-spacing:-.5px;color:var(--text)
  }
  .res-card-score .score-lbl{
    font-size:9px;font-weight:600;text-transform:uppercase;
    letter-spacing:1px;color:var(--text-muted)
  }

  /* ── AGENDA ── */
  .res-agenda{display:flex;flex-direction:column;gap:10px;margin-bottom:32px}
  .agenda-item{
    background:#fff;border:1px solid var(--border);
    border-left:3px solid var(--red);border-radius:0 10px 10px 0;
    padding:14px 18px;display:flex;align-items:center;gap:16px
  }
  .agenda-date{text-align:center;min-width:42px;flex-shrink:0}
  .agenda-date .d{
    font-family:var(--font-heading),Georgia,serif;
    font-size:24px;font-weight:800;color:var(--red);line-height:1
  }
  .agenda-date .m{font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:.8px}
  .agenda-sep{width:1px;height:38px;background:var(--border);flex-shrink:0}
  .agenda-info .vs{font-weight:700;font-size:14px;color:var(--text)}
  .agenda-info .loc{font-size:12px;color:var(--text-muted);margin-top:2px}
  .agenda-right{margin-left:auto;text-align:right;flex-shrink:0}
  .agenda-right .hora{font-weight:700;font-size:14px;color:var(--text)}
  .agenda-right .rd{font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px}

  /* ── CLASSIFICAÇÃO ── */
  .tbl-wrap{overflow-x:auto;border-radius:12px;border:1px solid var(--border);margin-bottom:32px}
  .tbl{width:100%;border-collapse:collapse;font-size:13px}
  .tbl th{
    background:#F3EFE9;padding:10px 12px;text-align:left;
    font-size:10px;text-transform:uppercase;letter-spacing:1px;
    color:var(--text-muted);font-weight:700;white-space:nowrap
  }
  .tbl th:not(:first-child):not(:nth-child(2)){text-align:center}
  .tbl td{padding:12px 12px;border-top:1px solid var(--border);vertical-align:middle}
  .tbl td:not(:first-child):not(:nth-child(2)){text-align:center;color:var(--text-muted)}
  .tbl .pts{font-weight:800;font-size:16px;color:var(--text);text-align:center}
  .tbl .nos{background:#FFF5F5}
  .tbl .nos td{color:var(--red-dark)}
  .tbl .nos .pts{color:var(--red-dark)}
  .pos-chip{
    width:26px;height:26px;border-radius:7px;
    display:inline-flex;align-items:center;justify-content:center;
    font-weight:700;font-size:12px;background:#F3F4F6;color:#4B5563
  }
  .nos .pos-chip{background:var(--red);color:#fff}
  .star{color:var(--red);margin-right:3px}
  .tbl .td-name{font-weight:600;color:var(--text)}
  .nos .td-name{color:var(--red-dark)}

  /* ── SHARE ── */
  .res-share{
    display:inline-flex;align-items:center;gap:8px;
    background:#25D366;color:#fff;border-radius:8px;
    padding:11px 20px;font-size:13px;font-weight:700;
    transition:all .2s;box-shadow:0 4px 12px rgba(37,211,102,.3)
  }
  .res-share:hover{background:#1ebe5a;transform:translateY(-1px)}

  /* ── EMPTY ── */
  .res-empty{text-align:center;padding:88px 24px}
  .res-empty .icon{width:72px;height:72px;background:rgba(198,40,40,.08);border-radius:20px;
    display:flex;align-items:center;justify-content:center;font-size:34px;margin:0 auto 24px}
  .res-empty h2{
    font-family:var(--font-heading),Georgia,serif;
    font-size:24px;font-weight:800;color:var(--text);margin-bottom:8px
  }
  .res-empty p{font-size:14px;color:var(--text-muted);max-width:380px;margin:0 auto 28px;line-height:1.6}
  .res-empty-links{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  .res-empty-btn{display:inline-flex;align-items:center;gap:7px;padding:11px 22px;border-radius:100px;
    font-size:13px;font-weight:700;letter-spacing:.3px;transition:all .2s}
  .res-empty-btn.primary{background:var(--red);color:#fff;box-shadow:0 4px 14px rgba(198,40,40,.3)}
  .res-empty-btn.primary:hover{background:var(--red-dark);transform:translateY(-1px)}
  .res-empty-btn.secondary{border:1.5px solid var(--border);color:var(--text-muted)}
  .res-empty-btn.secondary:hover{border-color:var(--red);color:var(--red)}

  /* ── FOOTER ── */
  .res-ftr{border-top:1px solid var(--border);padding:28px 24px}
  .res-ftr .inner{
    max-width:900px;margin:0 auto;
    display:flex;justify-content:center;gap:28px;flex-wrap:wrap
  }
  .res-ftr a{font-size:13px;font-weight:600;color:var(--red);opacity:.8;transition:opacity .2s}
  .res-ftr a:hover{opacity:1}

  /* ── MOBILE ── */
  @media(max-width:640px){
    .res-hero h1{font-size:28px}
    .prox-match{font-size:19px}
    .res-camp-name{font-size:20px}
    .res-card-score .score-num{font-size:20px}
    .res-proximo{padding:18px}
    .res-kpis{grid-template-columns:repeat(2,1fr)}
  }
`

function resultado(golsPro: number, golsContra: number): "V" | "E" | "D" {
  if (golsPro > golsContra) return "V"
  if (golsPro === golsContra) return "E"
  return "D"
}

export default async function ResultadosPage() {
  const campeonatos = await db.campeonato.findMany({
    where: { partidas: { some: {} } },
    include: {
      partidas: { orderBy: { data: "desc" }, take: 30 },
      classificacaoFpfs: { orderBy: [{ fase: "asc" }, { posicao: "asc" }] },
    },
    orderBy: { dataInicio: "desc" },
  })

  const agora = new Date()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  return (
    <div className={`res ${inter.variable} ${playfair.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <PublicHeader subtitle="Resultados & Classificação" />

      <div className="res-hero">
        <div className="inner">
          <h1>Jogos & Classificação</h1>
          <p>Resultados, próximos jogos e tabela de classificação da Escolinha Itaquerense.</p>
        </div>
      </div>

      <div className="res-body">
        {campeonatos.length === 0 && (
          <div className="res-empty">
            <div className="icon">⚽</div>
            <h2>Nenhum campeonato em andamento</h2>
            <p>Quando houver competições, os resultados e a classificação aparecerão aqui automaticamente.</p>
            <div className="res-empty-links">
              <Link href="/horarios" className="res-empty-btn primary">Ver turmas &amp; horários</Link>
              <Link href="/matricula" className="res-empty-btn secondary">Fazer matrícula</Link>
            </div>
          </div>
        )}

        {campeonatos.map((camp) => {
          const nossas = camp.partidas.filter((p) => p.local !== "Neutro")
          const realizadas = nossas.filter((p) => p.golsPro != null)
          const futuras = nossas
            .filter((p) => p.golsPro == null && new Date(p.data) >= agora)
            .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
            .slice(0, 5)

          const proximoJogo = futuras[0] ?? null
          const realizadasDisplay = realizadas.slice(0, 5)
          const vitorias = realizadas.filter((p) => p.golsPro! > p.golsContra!).length
          const saldo = realizadas.reduce((sum, p) => sum + ((p.golsPro ?? 0) - (p.golsContra ?? 0)), 0)
          const shareMsg = `Resultados da Escolinha Itaquerense — ${camp.nome}: ${appUrl}/resultados`
          const waHref = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`

          return (
            <div key={camp.id} className="res-camp">
              <div className="res-camp-hdr">
                <div className="res-camp-icon">
                  <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                  </svg>
                </div>
                <div>
                  <div className="res-camp-name">{camp.nome}</div>
                  <div className="res-camp-meta">
                    <span className="bdg bdg-status">{camp.status}</span>
                    {camp.fpfsEventoId && <span className="bdg bdg-fpfs">FPFS</span>}
                    {camp.fpfsSyncEm && (
                      <span className="bdg bdg-sync">
                        Sync {format(new Date(camp.fpfsSyncEm), "dd/MM 'às' HH'h'mm")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="res-kpis">
                <div className="res-kpi">
                  <div className="lbl">Jogos</div>
                  <div className="val">{realizadas.length}</div>
                  <div className="sub">partidas realizadas</div>
                </div>
                <div className="res-kpi">
                  <div className="lbl">Vitórias</div>
                  <div className="val">{vitorias}</div>
                  <div className="sub">{realizadas.length ? `${Math.round((vitorias / realizadas.length) * 100)}% de aproveitamento em vitorias` : "sem jogos encerrados"}</div>
                </div>
                <div className="res-kpi">
                  <div className="lbl">Agenda</div>
                  <div className="val">{futuras.length}</div>
                  <div className="sub">proximo(s) compromisso(s)</div>
                </div>
                <div className="res-kpi">
                  <div className="lbl">Saldo</div>
                  <div className="val">{saldo > 0 ? `+${saldo}` : saldo}</div>
                  <div className="sub">gols no acumulado</div>
                </div>
              </div>

              {proximoJogo && (
                <>
                  <div className="sec-lbl">Próximo jogo</div>
                  <div className="res-proximo">
                    <div className="prox-body">
                      <div className="prox-pill">
                        {proximoJogo.rodada != null ? `${proximoJogo.rodada}ª Rodada` : "Próximo jogo"}
                      </div>
                      <div className="prox-match">
                        Itaquerense × {proximoJogo.adversario}
                      </div>
                      <div className="prox-meta">
                        {format(new Date(proximoJogo.data), "EEEE, dd 'de' MMMM 'às' HH'h'mm", { locale: ptBR })}
                        {proximoJogo.local && ` · ${proximoJogo.local}`}
                      </div>
                    </div>
                    <Image
                      src="/logo.png" alt="" width={60} height={60}
                      className="prox-logo"
                      style={{ filter: "brightness(0) invert(1)", opacity: .2, flexShrink: 0 }}
                    />
                  </div>
                </>
              )}

              {realizadasDisplay.length > 0 && (
                <>
                  <div className="sec-lbl">Últimos resultados</div>
                  <div className="res-cards">
                    {realizadasDisplay.map((p) => {
                      const r = resultado(p.golsPro!, p.golsContra!)
                      const badgeClass = r === "V" ? "rbv" : r === "E" ? "rbe" : "rbd"
                      return (
                        <div key={p.id} className="res-card">
                          <div className={`res-rbadge ${badgeClass}`}>{r}</div>
                          <div className="res-card-info">
                            <div className="adv">vs. {p.adversario}</div>
                            <div className="meta">
                              {format(new Date(p.data), "dd/MM/yyyy", { locale: ptBR })}
                              {p.rodada != null && ` · ${p.rodada}ª Rodada`}
                              {p.sumulaUrl && (
                                <> · <a href={p.sumulaUrl} target="_blank" rel="noopener noreferrer" className="sumula-lnk">Súmula ↗</a></>
                              )}
                            </div>
                          </div>
                          <div className="res-card-score">
                            <div className="score-lbl">Placar</div>
                            <div className="score-num">{p.golsPro} × {p.golsContra}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {futuras.length > 1 && (
                <>
                  <div className="sec-lbl">Agenda</div>
                  <div className="res-agenda">
                    {futuras.slice(1).map((p) => (
                      <div key={p.id} className="agenda-item">
                        <div className="agenda-date">
                          <div className="d">{format(new Date(p.data), "dd")}</div>
                          <div className="m">{format(new Date(p.data), "MMM", { locale: ptBR })}</div>
                        </div>
                        <div className="agenda-sep" />
                        <div className="agenda-info">
                          <div className="vs">Itaquerense × {p.adversario}</div>
                          <div className="loc">{p.local ?? "Local a definir"}</div>
                        </div>
                        <div className="agenda-right">
                          <div className="hora">{format(new Date(p.data), "HH'h'mm")}</div>
                          {p.rodada != null && <div className="rd">{p.rodada}ª Rod.</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {camp.classificacaoFpfs.length > 0 && (
                <>
                  <div className="sec-lbl">Classificação</div>
                  <div className="tbl-wrap">
                    <table className="tbl">
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
                        {camp.classificacaoFpfs.map((l) => (
                          <tr key={l.id} className={l.ehNosso ? "nos" : ""}>
                            <td><span className="pos-chip">{l.posicao}</span></td>
                            <td className="td-name">
                              {l.ehNosso && <span className="star">★</span>}
                              {l.timeNome}
                            </td>
                            <td className="pts">{l.pontos}</td>
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
                </>
              )}

              <a href={waHref} target="_blank" rel="noopener noreferrer" className="res-share">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.535 5.856L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.015-1.375l-.36-.214-3.727.977 1.012-3.618-.237-.376A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Compartilhar no WhatsApp
              </a>
            </div>
          )
        })}
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
