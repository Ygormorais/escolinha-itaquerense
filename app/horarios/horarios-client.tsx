"use client"

import { useState } from "react"
import Link from "next/link"
import type { TurmaInfo } from "@/lib/landing/turmas"

const FAIXA_ETARIA: Record<string, string> = {
  "Sub-7":  "5 – 7 anos",
  "Sub-9":  "7 – 9 anos",
  "Sub-11": "9 – 11 anos",
  "Sub-13": "11 – 13 anos",
  "Sub-15": "13 – 15 anos",
  "Sub-17": "15 – 17 anos",
  "Sub-18": "17 – 18 anos",
}

const MODALIDADES = {
  escolinha: {
    key: "escolinha",
    label: "Futsal Escolinha",
    icon: "ti-ball-football",
    desc: "Iniciação esportiva e formação de base",
    subs: ["Sub-7", "Sub-9", "Sub-11", "Sub-13"],
    cor: "#C62828",
  },
  federado: {
    key: "federado",
    label: "Futsal Federado",
    icon: "ti-trophy",
    desc: "Entrada somente por avaliação do atleta",
    subs: ["Sub-11", "Sub-13", "Sub-15", "Sub-17", "Sub-18"],
    cor: "var(--red-deep)",
  },
} as const

type ModalidadeKey = keyof typeof MODALIDADES

const css = `
  .hc *{margin:0;padding:0;box-sizing:border-box}

  /* ── TABS ── */
  .hc .tabs-wrap{padding:32px 0 0}
  .hc .tabs-head{display:flex;align-items:stretch;gap:0;background:#fff;
    border:1px solid var(--border);border-radius:var(--radius-xl);overflow:hidden;
    box-shadow:var(--shadow-sm)}
  .hc .tab-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:10px;
    padding:18px 24px;cursor:pointer;border:none;background:transparent;
    font-family:var(--font-body),Arial,sans-serif;font-size:14px;font-weight:600;
    color:var(--text-muted);transition:all .22s var(--ease);position:relative;text-align:center}
  .hc .tab-btn i{font-size:18px;transition:color .22s var(--ease)}
  .hc .tab-btn .tab-label{display:flex;flex-direction:column;align-items:flex-start;gap:2px}
  .hc .tab-btn .tab-label strong{font-size:14px;font-weight:700;letter-spacing:.1px}
  .hc .tab-btn .tab-label span{font-size:11px;font-weight:400;opacity:.7}
  .hc .tab-btn.active-escolinha{background:linear-gradient(135deg,var(--red),var(--red-soft));color:#fff}
  .hc .tab-btn.active-escolinha i{color:rgba(255,255,255,.9)}
  .hc .tab-btn.active-escolinha .tab-label span{opacity:.85}
  .hc .tab-btn.active-federado{background:linear-gradient(135deg,var(--red-deep),var(--red-darker));color:#fff}
  .hc .tab-btn.active-federado i{color:rgba(255,255,255,.85)}
  .hc .tab-btn.active-federado .tab-label span{opacity:.85}
  .hc .tab-btn:not([class*="active"]):hover{background:var(--bg-muted);color:var(--text)}
  .hc .tab-divider{width:1px;background:var(--border);flex-shrink:0}
  @media(max-width:480px){
    .hc .tab-btn{padding:14px 12px;gap:8px}
    .hc .tab-btn .tab-label strong{font-size:13px}
    .hc .tab-btn .tab-label span{display:none}
  }

  /* ── SUB CHIPS ── */
  .hc .sub-wrap{padding:24px 0 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .hc .sub-label{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
    color:var(--text-light);margin-right:4px;white-space:nowrap}
  .hc .sub-chip{padding:7px 16px;border-radius:100px;font-size:12px;font-weight:700;
    letter-spacing:.4px;cursor:pointer;border:1.5px solid var(--border);background:#fff;
    color:var(--text-muted);transition:all .18s var(--ease)}
  .hc .sub-chip:hover{border-color:var(--red);color:var(--red)}
  .hc .sub-chip.active{background:var(--red);border-color:var(--red);color:#fff;
    box-shadow:0 3px 10px rgba(198,40,40,.25)}
  .hc .sub-chip.active-fed{background:var(--red-deep);border-color:var(--red-deep);color:#fff;
    box-shadow:0 3px 10px rgba(26,26,46,.25)}
  .hc .sub-chip.active-fed:hover{background:var(--red-darker)}

  /* Aviso federado */
  .hc .fed-notice{margin:28px 0 0;padding:22px 24px;border-radius:var(--radius-lg);
    background:linear-gradient(135deg,var(--red-deep) 0%,var(--red-darker) 100%);color:#fff;
    border:1px solid rgba(255,255,255,.08);box-shadow:var(--shadow-md)}
  .hc .fed-notice h3{font-family:var(--font-heading),Georgia,serif;font-size:18px;
    font-weight:800;margin:0 0 12px;letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
  .hc .fed-notice h3 i{font-size:20px;opacity:.9}
  .hc .fed-notice ul{list-style:none;display:flex;flex-direction:column;gap:10px;margin:0;padding:0}
  .hc .fed-notice li{display:flex;align-items:flex-start;gap:10px;font-size:14px;line-height:1.5;
    color:rgba(255,255,255,.9)}
  .hc .fed-notice li i{flex-shrink:0;margin-top:2px;font-size:16px;color:#FBBF24}
  .hc .fed-notice li strong{color:#fff;font-weight:700}
  .hc .sub-chip-all{padding:7px 16px;border-radius:100px;font-size:12px;font-weight:700;
    cursor:pointer;border:1.5px solid var(--border);background:var(--bg-muted);
    color:var(--text-muted);transition:all .18s var(--ease)}
  .hc .sub-chip-all:hover{border-color:var(--text-muted);color:var(--text)}
  .hc .sub-chip-all.active{background:var(--text);border-color:var(--text);color:#fff}

  /* ── TURMAS GRID ── */
  .hc .turmas-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;padding-top:32px}
  .hc .tcard{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-xl);
    overflow:hidden;box-shadow:var(--shadow-sm);transition:all .25s var(--ease);position:relative}
  .hc .tcard:hover{box-shadow:var(--shadow-md);transform:translateY(-4px)}
  .hc .tcard-accent-red{height:5px;background:linear-gradient(90deg,var(--red),var(--red-soft))}
  .hc .tcard-accent-dark{height:5px;background:linear-gradient(90deg,var(--red-deep),var(--red-dark))}
  .hc .tcard-body{padding:26px 24px 24px}
  .hc .tcard-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
  .hc .tcard-cat{font-family:var(--font-heading),Georgia,serif;font-size:28px;font-weight:900;
    color:var(--text);letter-spacing:-1px;line-height:1}
  .hc .tcard-age{font-size:11px;font-weight:700;padding:4px 10px;border-radius:100px;
    letter-spacing:.5px;white-space:nowrap;margin-top:3px}
  .hc .tcard-age-red{color:var(--red);background:rgba(198,40,40,.08)}
  .hc .tcard-age-dark{color:var(--red-dark);background:rgba(26,26,46,.08)}
  .hc .tcard-divider{height:1px;background:var(--border);margin-bottom:16px}
  .hc .tcard-label{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
    color:var(--text-light);margin-bottom:10px}
  .hc .tcard-pills{display:flex;flex-direction:column;gap:8px}
  .hc .tcard-pill{display:flex;align-items:center;gap:9px;background:var(--bg-muted);
    border-radius:10px;padding:10px 13px;font-size:13px;font-weight:500;color:var(--text)}
  .hc .tcard-pill i{font-size:14px;flex-shrink:0}
  .hc .tcard-pill-red i{color:var(--red)}
  .hc .tcard-pill-dark i{color:var(--red-dark)}

  /* ── EMPTY / EM BREVE ── */
  .hc .soon-card{background:var(--bg-muted);border:1.5px dashed var(--border);
    border-radius:var(--radius-xl);padding:28px 24px;display:flex;flex-direction:column;
    align-items:center;justify-content:center;text-align:center;gap:10px;min-height:160px}
  .hc .soon-cat{font-family:var(--font-heading),Georgia,serif;font-size:22px;font-weight:800;
    color:var(--text-light);letter-spacing:-.5px}
  .hc .soon-badge{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;
    color:var(--text-light);background:var(--border);padding:4px 12px;border-radius:100px}

  .hc .vazio{text-align:center;padding:56px 0;color:var(--text-muted)}
  .hc .vazio i{font-size:48px;opacity:.2;display:block;margin-bottom:12px}
  .hc .vazio p{font-size:14px;max-width:340px;margin:0 auto;line-height:1.65}

  @media(max-width:820px){.hc .turmas-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:520px){.hc .turmas-grid{grid-template-columns:1fr}}

  /* ── INFO STRIP ── */
  .hc .info-strip{background:var(--bg-muted);border-radius:var(--radius-xl);
    border:1px solid var(--border);padding:28px 32px;display:flex;
    align-items:center;gap:20px;margin-top:40px}
  .hc .strip-icon{width:48px;height:48px;border-radius:12px;flex-shrink:0;
    display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px}
  .hc .strip-icon-red{background:linear-gradient(135deg,var(--red),var(--red-soft))}
  .hc .strip-icon-dark{background:linear-gradient(135deg,var(--red-deep),var(--red-darker))}
  .hc .strip-text b{display:block;font-size:14px;font-weight:700;color:var(--text);margin-bottom:4px}
  .hc .strip-text p{font-size:13px;color:var(--text-muted);line-height:1.55}
  @media(max-width:560px){.hc .info-strip{flex-direction:column;text-align:center;padding:20px}}

  /* ── CTA ── */
  .hc .cta{border-radius:var(--radius-xl);color:#fff;text-align:center;padding:52px 28px;
    position:relative;overflow:hidden;margin-top:40px}
  .hc .cta-red{background:radial-gradient(ellipse at 20% 50%,rgba(255,255,255,.07) 0%,transparent 60%),
    linear-gradient(135deg,var(--red) 0%,#7F0000 100%)}
  .hc .cta-dark{background:radial-gradient(ellipse at 20% 50%,rgba(255,255,255,.06) 0%,transparent 60%),
    linear-gradient(135deg,var(--red-deep) 0%,var(--red-deep) 100%)}
  .hc .cta::after{content:'';position:absolute;right:-60px;top:-60px;width:260px;height:260px;
    border-radius:50%;background:rgba(255,255,255,.05)}
  .hc .cta-inner{position:relative;z-index:1}
  .hc .cta h2{font-family:var(--font-heading),Georgia,serif;font-size:30px;font-weight:800;
    letter-spacing:-.4px;margin-bottom:10px}
  .hc .cta p{font-size:15px;opacity:.88;max-width:440px;margin:0 auto 28px;line-height:1.65}
  .hc .cta-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  .hc .btn-white{display:inline-flex;align-items:center;gap:8px;background:#fff;
    font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.7px;
    padding:14px 28px;border-radius:100px;transition:all .2s var(--ease)}
  .hc .btn-white-red{color:var(--red)}
  .hc .btn-white-dark{color:var(--red-deep)}
  .hc .btn-white:hover{background:rgba(255,255,255,.9);transform:translateY(-2px);
    box-shadow:0 8px 24px rgba(0,0,0,.2)}
  .hc .btn-wa{display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#fff;
    font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.7px;
    padding:14px 28px;border-radius:100px;border:2px solid rgba(255,255,255,.2);
    transition:all .2s var(--ease)}
  .hc .btn-wa:hover{background:#22c05e;transform:translateY(-2px);box-shadow:0 8px 24px rgba(37,211,102,.3)}
  @media(max-width:480px){
    .hc .cta h2{font-size:22px}
    .hc .cta{padding:36px 16px}
    .hc .cta-btns{flex-direction:column;width:100%}
    .hc .cta-btns a,.hc .cta-btns .btn-white{width:100%;justify-content:center;min-height:48px}
    .hc .fed-notice{padding:18px 16px}
    .hc .fed-notice h3{font-size:16px}
    .hc .fed-notice li{font-size:13px}
  }
`

type Props = {
  turmas: TurmaInfo[]
  waUrl: string
}

export default function HorariosClient({ turmas, waUrl }: Props) {
  const [modalidade, setModalidade] = useState<ModalidadeKey>("escolinha")
  const [subFiltro, setSubFiltro] = useState<string | null>(null)

  const mod = MODALIDADES[modalidade]
  const modalidades = Object.values(MODALIDADES) as (typeof MODALIDADES)[ModalidadeKey][]
  const subsAtivos = mod.subs

  const subsSet = new Set<string>(subsAtivos)
  const turmasFiltradas = subFiltro
    ? turmas.filter((t) => t.turma === subFiltro && subsSet.has(t.turma))
    : turmas.filter((t) => subsSet.has(t.turma))

  const subsComDados = new Set(turmas.map((t) => t.turma))
  const tabItems = modalidades.flatMap((m, idx) => (
    idx > 0
      ? [
          { type: "divider" as const, key: `divider-${m.key}` },
          { type: "button" as const, key: `button-${m.key}`, modalidade: m },
        ]
      : [
          { type: "button" as const, key: `button-${m.key}`, modalidade: m },
        ]
  ))

  return (
    <div className="hc">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="tabs-wrap">
        {/* TABS MODALIDADE */}
        <div className="tabs-head">
          {tabItems.map((item) => {
            if (item.type === "divider") {
              return <div className="tab-divider" key={item.key} />
            }

            const { modalidade: modalidadeItem } = item
            const isActive = modalidade === modalidadeItem.key
            const activeClass = isActive ? `active-${modalidadeItem.key}` : ""

            return (
              <button
                key={item.key}
                className={`tab-btn ${activeClass}`}
                onClick={() => { setModalidade(modalidadeItem.key as ModalidadeKey); setSubFiltro(null) }}
              >
                <i className={`ti ${modalidadeItem.icon}`}></i>
                <div className="tab-label">
                  <strong>{modalidadeItem.label}</strong>
                  <span>{modalidadeItem.desc}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* CHIPS SUB-CATEGORIA */}
        <div className="sub-wrap">
          <span className="sub-label">Categoria</span>
          <button
            className={`sub-chip-all${subFiltro === null ? " active" : ""}`}
            onClick={() => setSubFiltro(null)}
          >
            Todas
          </button>
          {subsAtivos.map((sub) => {
            const isActive = subFiltro === sub
            const isFed = modalidade === "federado"
            return (
              <button
                key={sub}
                className={`sub-chip${isActive ? (isFed ? " active-fed" : " active") : ""}`}
                onClick={() => setSubFiltro(isActive ? null : sub)}
              >
                {sub}
              </button>
            )
          })}
        </div>
      </div>

      {/* GRID */}
      {turmasFiltradas.length === 0 && subsAtivos.every((s) => !subsComDados.has(s)) ? (
        <div className="vazio" style={{ paddingTop: 48 }}>
          <i className="ti ti-trophy-off"></i>
          <p>Nenhuma turma de {mod.label} com horários cadastrados ainda. Em breve!</p>
        </div>
      ) : (
        <div className="turmas-grid">
          {subsAtivos
            .filter((sub) => subFiltro === null || sub === subFiltro)
            .map((sub) => {
              const dados = turmas.find((t) => t.turma === sub)
              const isFed = modalidade === "federado"
              if (!dados) {
                return (
                  <div className="soon-card" key={sub}>
                    <div className="soon-cat">{sub}</div>
                    {FAIXA_ETARIA[sub] && (
                      <div style={{ fontSize: 12, color: "var(--text-light)", fontWeight: 500 }}>
                        {FAIXA_ETARIA[sub]}
                      </div>
                    )}
                    <div className="soon-badge">Em breve</div>
                  </div>
                )
              }
              return (
                <div className={`tcard`} key={sub}>
                  <div className={isFed ? "tcard-accent-dark" : "tcard-accent-red"} />
                  <div className="tcard-body">
                    <div className="tcard-top">
                      <div className="tcard-cat">{sub}</div>
                      {FAIXA_ETARIA[sub] && (
                        <div className={`tcard-age ${isFed ? "tcard-age-dark" : "tcard-age-red"}`}>
                          {FAIXA_ETARIA[sub]}
                        </div>
                      )}
                    </div>
                    <div className="tcard-divider" />
                    <div className="tcard-label">Horários de treino</div>
                    <div className="tcard-pills">
                      {dados.horarios.map((h) => (
                        <div className={`tcard-pill ${isFed ? "tcard-pill-dark" : "tcard-pill-red"}`} key={h}>
                          <i className="ti ti-clock"></i>
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* INFO STRIP / AVISO FEDERADO */}
      {modalidade === "escolinha" ? (
        <div className="info-strip">
          <div className="strip-icon strip-icon-red">
            <i className={`ti ${mod.icon}`}></i>
          </div>
          <div className="strip-text">
            <b>Vagas limitadas — formação individual</b>
            <p>
              As turmas da Escolinha têm capacidade reduzida para garantir atenção
              individual ao desenvolvimento de cada atleta.
            </p>
          </div>
        </div>
      ) : (
        <div className="fed-notice" role="note">
          <h3>
            <i className="ti ti-alert-circle" aria-hidden />
            Como funciona o Futsal Federado
          </h3>
          <ul>
            <li>
              <i className="ti ti-calendar-event" aria-hidden />
              <span>
                <strong>Temporada de avaliações:</strong> somente{" "}
                <strong>antes do começo</strong> e{" "}
                <strong>ao final das competições</strong> — não há seletiva o ano todo.
              </span>
            </li>
            <li>
              <i className="ti ti-lock" aria-hidden />
              <span>
                <strong>Turmas não são abertas:</strong> não há matrícula livre nem
                entrada contínua nas equipes federadas.
              </span>
            </li>
            <li>
              <i className="ti ti-whistle" aria-hidden />
              <span>
                <strong>Vagas de entrada somente via avaliação do atleta</strong> —
                aprovação da comissão técnica é obrigatória.
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className={`cta ${modalidade === "federado" ? "cta-dark" : "cta-red"}`}>
        <div className="cta-inner">
          <h2>
            {modalidade === "escolinha"
              ? "Garanta a vaga do seu filho"
              : "Quer tentar uma vaga no federado?"}
          </h2>
          <p>
            {modalidade === "escolinha"
              ? "Faça a pré-matrícula agora ou tire suas dúvidas pelo WhatsApp — respondemos rapidinho."
              : "Fale conosco no período de avaliações (pré-temporada ou pós-campeonato). Fora dessas janelas as equipes não recebem novos atletas."}
          </p>
          <div className="cta-btns">
            {modalidade === "escolinha" ? (
              <Link className="btn-white btn-white-red" href="/matricula">
                <i className="ti ti-clipboard-text"></i>
                Fazer Matrícula
              </Link>
            ) : (
              <a className="btn-white btn-white-dark" href={waUrl} target="_blank" rel="noopener noreferrer">
                <i className="ti ti-whistle"></i>
                Perguntar sobre avaliações
              </a>
            )}
            <a className="btn-wa" href={waUrl} target="_blank" rel="noopener noreferrer">
              <i className="ti ti-brand-whatsapp"></i>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
