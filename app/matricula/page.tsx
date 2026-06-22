import Link from "next/link"
import { inter, playfair } from "@/lib/public-fonts"
import { pubBase, PUB_HDR_CSS } from "@/lib/public-css"
import { PublicHeader } from "@/components/public/public-header"
import { MatriculaForm } from "./matricula-form"

export const metadata = {
  title: "Pré-Matrícula — E.C. Itaquerense",
  description: "Faça a pré-matrícula do seu filho na Escolinha Itaquerense de Futsal.",
}

const css = `
  ${pubBase("mat")}
  ${PUB_HDR_CSS}
  .mat .pub-hdr .inner{max-width:740px}

  /* ── HERO ── */
  .mat-hero{
    background:linear-gradient(135deg,#4A0B0B 0%,#C62828 55%,#9F1D1D 100%);
    color:#fff;padding:60px 24px 52px;position:relative;overflow:hidden
  }
  .mat-hero::before{
    content:'';position:absolute;inset:0;pointer-events:none;opacity:.06;
    background-image:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='1'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3Cline x1='0' y1='30' x2='60' y2='30'/%3E%3Cline x1='30' y1='0' x2='30' y2='60'/%3E%3C/g%3E%3C/svg%3E");
    background-size:60px 60px
  }
  .mat-hero .inner{max-width:740px;margin:0 auto;position:relative;z-index:1}
  .mat-season{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:100px;padding:5px 14px;margin-bottom:20px;backdrop-filter:blur(4px)}
  .mat-hero h1{font-family:var(--font-heading),Georgia,serif;font-size:40px;font-weight:800;letter-spacing:-1.5px;color:#fff;margin-bottom:12px;line-height:1.05}
  .mat-hero p{font-size:16px;color:rgba(255,255,255,.82);line-height:1.65;max-width:560px;margin-bottom:32px}
  .mat-trust{display:flex;flex-wrap:wrap;gap:22px}
  .mat-trust-item{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:rgba(255,255,255,.9)}
  .mat-trust-item::before{content:'';display:inline-block;width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.4);flex-shrink:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='2.5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 13l4 4L19 7'/%3E%3C/svg%3E");background-size:12px;background-repeat:no-repeat;background-position:center}

  /* ── BODY ── */
  .mat-body{max-width:740px;margin:0 auto;padding:40px 24px 80px}
  .mat-card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:20px;padding:48px;box-shadow:0 4px 6px rgba(0,0,0,.03),0 20px 60px rgba(26,26,46,.09)}

  /* ── FORM HEADER ── */
  .mat-form-hdr{margin-bottom:36px;padding-bottom:28px;border-bottom:1px solid #F0EAE2}
  .mat-form-title{font-family:var(--font-heading),Georgia,serif;font-size:22px;font-weight:800;color:var(--text);margin-bottom:6px}
  .mat-form-sub{font-size:13px;color:var(--text-muted)}

  /* ── SECTION HEADERS ── */
  .mat-sec{margin-bottom:28px}
  .mat-sec + .mat-sec{margin-top:36px;padding-top:36px;border-top:1px solid #F0EAE2}
  .mat-sec-hdr{display:flex;align-items:center;gap:12px;margin-bottom:22px}
  .mat-sec-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#C62828,#9F1D1D);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;box-shadow:0 4px 12px rgba(198,40,40,.3)}
  .mat-sec-icon svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .mat-sec-title{font-size:15px;font-weight:700;color:var(--text);letter-spacing:.2px}
  .mat-sec-line{flex:1;height:1px;background:linear-gradient(90deg,#E8E2DA,transparent)}

  /* ── FIELD GROUP ── */
  .mat-field{display:flex;flex-direction:column;gap:6px}
  .mat-field label{font-size:13px;font-weight:600;color:#444;letter-spacing:.2px}
  .mat-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .mat-fields{display:flex;flex-direction:column;gap:18px}

  /* ── INPUTS ── */
  .mat-input{
    width:100%;height:48px;padding:0 14px;
    border:1.5px solid #E0D9D0;border-radius:10px;
    background:#FAFAF8;color:var(--text);
    font-family:var(--font-body),Arial,sans-serif;font-size:15px;
    transition:border-color .2s,box-shadow .2s,background .2s;outline:none;display:block
  }
  .mat-input::placeholder{color:#B0A9A2}
  .mat-input:hover{border-color:#C4B9B0}
  .mat-input:focus{border-color:var(--red);box-shadow:0 0 0 3px rgba(198,40,40,.1);background:#fff}
  .mat-textarea{
    width:100%;padding:12px 14px;min-height:96px;resize:vertical;
    border:1.5px solid #E0D9D0;border-radius:10px;
    background:#FAFAF8;color:var(--text);
    font-family:var(--font-body),Arial,sans-serif;font-size:15px;line-height:1.55;
    transition:border-color .2s,box-shadow .2s,background .2s;outline:none;display:block
  }
  .mat-textarea::placeholder{color:#B0A9A2}
  .mat-textarea:hover{border-color:#C4B9B0}
  .mat-textarea:focus{border-color:var(--red);box-shadow:0 0 0 3px rgba(198,40,40,.1);background:#fff}
  .mat-input-wrap{position:relative}
  .mat-input-wrap .mat-input{padding-left:40px}
  .mat-input-wrap svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#B0A9A2;pointer-events:none}

  /* ── SELECT OVERRIDE ── */
  .mat [role=combobox]{
    height:48px !important;border:1.5px solid #E0D9D0 !important;border-radius:10px !important;
    background:#FAFAF8 !important;font-size:15px !important;color:var(--text) !important;
    font-family:var(--font-body),Arial,sans-serif !important;
    transition:border-color .2s,box-shadow .2s !important;padding-left:14px !important
  }
  .mat [role=combobox]:hover{border-color:#C4B9B0 !important}
  .mat [role=combobox][data-state=open],
  .mat [role=combobox]:focus{border-color:var(--red) !important;box-shadow:0 0 0 3px rgba(198,40,40,.1) !important;background:#fff !important}

  /* ── UPLOAD ── */
  .mat-upload{margin-top:4px;border:2px dashed #DDD6CE;border-radius:14px;padding:36px 24px;text-align:center;cursor:pointer;background:#FAFAF8;transition:all .2s;display:block}
  .mat-upload:hover{border-color:var(--red);background:rgba(198,40,40,.025)}
  .mat-upload.uploading{opacity:.6;cursor:not-allowed}
  .mat-upload-icon{font-size:28px;margin-bottom:10px}
  .mat-upload-main{font-size:14px;font-weight:700;color:var(--red);margin-bottom:4px}
  .mat-upload-sub{font-size:12px;color:var(--text-muted)}
  .mat-docs{margin-top:12px;display:flex;flex-direction:column;gap:8px}
  .mat-doc{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:#FAFAF8;font-size:13px;color:var(--text-muted)}

  /* ── SUBMIT ── */
  .mat-submit{
    width:100%;margin-top:8px;
    background:linear-gradient(135deg,#C62828 0%,#9F1D1D 100%);
    color:#fff;border:none;border-radius:12px;height:54px;
    font-family:var(--font-body),Arial,sans-serif;font-size:16px;font-weight:700;letter-spacing:.5px;
    cursor:pointer;transition:all .25s;box-shadow:0 4px 18px rgba(198,40,40,.38);
    display:flex;align-items:center;justify-content:center;gap:10px
  }
  .mat-submit:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(198,40,40,.48)}
  .mat-submit:active:not(:disabled){transform:translateY(0)}
  .mat-submit:disabled{opacity:.65;cursor:not-allowed;transform:none}

  /* ── SUCCESS STATE ── */
  .mat-success{text-align:center;padding:56px 24px}
  .mat-success-icon{
    width:84px;height:84px;border-radius:50%;margin:0 auto 24px;
    background:linear-gradient(135deg,#22c55e,#16a34a);
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 8px 28px rgba(34,197,94,.3)
  }
  .mat-success-icon svg{width:40px;height:40px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  .mat-success h2{font-family:var(--font-heading),Georgia,serif;font-size:26px;font-weight:800;color:var(--text);margin-bottom:10px}
  .mat-success p{font-size:15px;color:var(--text-muted);line-height:1.65;max-width:380px;margin:0 auto}

  /* ── FOOTER ── */
  .mat-foot{border-top:1px solid var(--border);padding:24px}
  .mat-foot .inner{max-width:740px;margin:0 auto;display:flex;justify-content:center;gap:24px;flex-wrap:wrap}
  .mat-foot a{font-size:13px;font-weight:600;color:var(--red);opacity:.8;transition:opacity .2s}
  .mat-foot a:hover{opacity:1}

  @media(max-width:640px){
    .mat-hero h1{font-size:28px;letter-spacing:-1px}
    .mat-hero{padding:44px 20px 40px}
    .mat-body{padding:28px 16px 60px}
    .mat-card{padding:28px 20px}
    .mat-row{grid-template-columns:1fr}
    .mat-trust{gap:14px}
  }
`

const TRUST = [
  "Resposta em até 48h",
  "Vagas limitadas por categoria",
  "Sem compromisso inicial",
]

export default function MatriculaPage() {
  return (
    <div className={`mat ${inter.variable} ${playfair.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <PublicHeader subtitle="Pré-Matrícula" />

      <div className="mat-hero">
        <div className="inner">
          <div className="mat-season">⚽ Temporada 2026</div>
          <h1>Pré-Matrícula</h1>
          <p>Preencha os dados abaixo e entraremos em contato em até 48h para confirmar a vaga e passar as informações sobre mensalidade e documentação.</p>
          <div className="mat-trust">
            {TRUST.map((t) => (
              <span key={t} className="mat-trust-item">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="mat-body">
        <div className="mat-card">
          <div className="mat-form-hdr">
            <div className="mat-form-title">Formulário de Inscrição</div>
            <div className="mat-form-sub">Campos com * são obrigatórios</div>
          </div>
          <MatriculaForm />
        </div>
      </div>

      <footer className="mat-foot">
        <div className="inner">
          <Link href="/responsavel">Portal do Responsável</Link>
          <Link href="/resultados">Resultados</Link>
          <Link href="/">← Voltar ao site</Link>
        </div>
      </footer>
    </div>
  )
}
