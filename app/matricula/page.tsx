import Link from "next/link"
import { Check } from "lucide-react"
import { PaginaPublica } from "@/components/site/pagina-publica"
import { getConfig } from "@/lib/config"
import { MatriculaForm } from "./matricula-form"

export const metadata = {
  title: "Pré-Matrícula — E.C. Itaquerense",
  description:
    "Pré-matrícula da escolinha de futsal do E.C. Itaquerense. Envie os dados do aluno e do responsável — respondemos em até 48h.",
}

const css = `
  /* ── GARANTIAS (faixa de título) ── */
  .mat .mat-trust{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:20px}
  .mat .mat-trust-item{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;color:rgba(255,255,255,.9)}
  .mat .mat-trust-item svg{flex-shrink:0;color:#fff}

  /* ── FORMULÁRIO ── */
  .mat .mat-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-sm);padding:48px}

  /* ── FORM HEADER ── */
  .mat .mat-form-hdr{margin-bottom:36px;padding-bottom:28px;border-bottom:1px solid var(--border)}
  .mat .mat-form-title{font-family:var(--font-heading),Georgia,serif;font-size:22px;font-weight:800;color:var(--text);margin-bottom:6px}
  .mat .mat-form-sub{font-size:13px;color:var(--text-muted)}

  /* ── SECTION HEADERS ── */
  .mat .mat-sec{margin-bottom:28px}
  .mat .mat-sec + .mat-sec{margin-top:36px;padding-top:36px;border-top:1px solid var(--border)}
  .mat .mat-sec-hdr{display:flex;align-items:center;gap:12px;margin-bottom:22px}
  .mat .mat-sec-icon{width:36px;height:36px;border-radius:10px;background:var(--red);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0}
  .mat .mat-sec-icon svg{width:16px;height:16px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .mat .mat-sec-title{font-size:15px;font-weight:700;color:var(--text);letter-spacing:.2px}
  .mat .mat-sec-line{flex:1;height:1px;background:linear-gradient(90deg,var(--border),transparent)}

  /* ── FIELD GROUP ── */
  .mat .mat-field{display:flex;flex-direction:column;gap:6px}
  .mat .mat-field label{font-size:13px;font-weight:600;color:var(--text-muted);letter-spacing:.2px}
  .mat .mat-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .mat .mat-fields{display:flex;flex-direction:column;gap:18px}

  /* ── INPUTS (tokens — dark mode amigável) ── */
  .mat .mat-input{
    width:100%;height:48px;padding:0 14px;
    border:1.5px solid var(--border-strong,#E0D9D0);border-radius:var(--radius-sm,10px);
    background:var(--bg-muted,#FAFAF8);color:var(--text);
    font-family:var(--font-body),Arial,sans-serif;font-size:15px;
    transition:border-color .2s,box-shadow .2s,background .2s;outline:none;display:block
  }
  .mat .mat-input::placeholder{color:var(--text-light,#B0A9A2)}
  .mat .mat-input:hover{border-color:var(--text-light,#C4B9B0)}
  .mat .mat-input:focus{border-color:var(--red);box-shadow:0 0 0 3px color-mix(in srgb, var(--brand-600) 12%, transparent);background:var(--bg-card,#fff)}
  .mat .mat-textarea{
    width:100%;padding:12px 14px;min-height:96px;resize:vertical;
    border:1.5px solid var(--border-strong,#E0D9D0);border-radius:var(--radius-sm,10px);
    background:var(--bg-muted,#FAFAF8);color:var(--text);
    font-family:var(--font-body),Arial,sans-serif;font-size:15px;line-height:1.55;
    transition:border-color .2s,box-shadow .2s,background .2s;outline:none;display:block
  }
  .mat .mat-textarea::placeholder{color:var(--text-light,#B0A9A2)}
  .mat .mat-textarea:hover{border-color:var(--text-light,#C4B9B0)}
  .mat .mat-textarea:focus{border-color:var(--red);box-shadow:0 0 0 3px color-mix(in srgb, var(--brand-600) 12%, transparent);background:var(--bg-card,#fff)}
  .mat .mat-input-wrap{position:relative}
  .mat .mat-input-wrap .mat-input{padding-left:40px}
  .mat .mat-input-wrap svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--text-light,#B0A9A2);pointer-events:none}

  /* ── SELECT OVERRIDE ── */
  .mat [role=combobox]{
    height:48px !important;border:1.5px solid var(--border-strong,#E0D9D0) !important;border-radius:var(--radius-sm,10px) !important;
    background:var(--bg-muted,#FAFAF8) !important;font-size:15px !important;color:var(--text) !important;
    font-family:var(--font-body),Arial,sans-serif !important;
    transition:border-color .2s,box-shadow .2s !important;padding-left:14px !important
  }
  .mat [role=combobox]:hover{border-color:var(--text-light,#C4B9B0) !important}
  .mat [role=combobox][data-state=open],
  .mat [role=combobox]:focus{border-color:var(--red) !important;box-shadow:0 0 0 3px color-mix(in srgb, var(--brand-600) 12%, transparent) !important;background:var(--bg-card,#fff) !important}

  /* ── UPLOAD ── */
  .mat .mat-upload{margin-top:4px;border:2px dashed var(--border-strong,#DDD6CE);border-radius:var(--radius-md,14px);padding:36px 24px;text-align:center;cursor:pointer;background:var(--bg-muted,#FAFAF8);transition:all .2s;display:block}
  .mat .mat-upload:hover{border-color:var(--red);background:color-mix(in srgb, var(--brand-600) 6%, transparent)}
  .mat .mat-upload.uploading{opacity:.6;cursor:not-allowed}
  .mat .mat-upload-icon{font-size:28px;margin-bottom:10px}
  .mat .mat-upload-main{font-size:14px;font-weight:700;color:var(--red);margin-bottom:4px}
  .mat .mat-upload-sub{font-size:12px;color:var(--text-muted)}
  .mat .mat-docs{margin-top:12px;display:flex;flex-direction:column;gap:8px}
  .mat .mat-doc{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius-sm,10px);background:var(--bg-muted,#FAFAF8);font-size:13px;color:var(--text-muted)}

  /* ── SUBMIT ── */
  .mat .mat-submit{
    width:100%;margin-top:8px;
    background:var(--red);
    color:#fff;border:none;border-radius:var(--radius-pill);height:54px;
    font-family:var(--font-body),Arial,sans-serif;font-size:16px;font-weight:700;
    cursor:pointer;transition:background .2s;
    display:flex;align-items:center;justify-content:center;gap:10px
  }
  .mat .mat-submit:hover:not(:disabled){background:var(--red-dark)}
  .mat .mat-submit:disabled{opacity:.65;cursor:not-allowed;transform:none}

  /* ── SUCCESS STATE ── */
  .mat .mat-success{text-align:center;padding:56px 24px}
  .mat .mat-success-icon{
    width:84px;height:84px;border-radius:50%;margin:0 auto 24px;
    background:var(--success-600);
    display:flex;align-items:center;justify-content:center
  }
  .mat .mat-success-icon svg{width:40px;height:40px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  .mat .mat-success h2{font-family:var(--font-heading),Georgia,serif;font-size:26px;font-weight:800;color:var(--text);margin-bottom:10px}
  .mat .mat-success p{font-size:15px;color:var(--text-muted);line-height:1.65;max-width:400px;margin:0 auto 24px}
  .mat .mat-success-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
  .mat .mat-success-actions a{
    display:inline-flex;align-items:center;justify-content:center;gap:6px;
    min-height:44px;padding:10px 18px;border-radius:var(--radius-pill);
    font-size:14px;font-weight:700;text-decoration:none;transition:background .15s,border-color .15s,color .15s
  }
  .mat .mat-success-primary{background:var(--red);color:#fff}
  .mat .mat-success-primary:hover{background:var(--red-dark)}
  .mat .mat-success-secondary{border:1.5px solid var(--border);color:var(--text);background:var(--bg-elevated,var(--paper-raised))}
  .mat .mat-success-secondary:hover{border-color:var(--red);color:var(--red)}
  .mat .mat-hint{font-size:12px;color:var(--text-muted);margin-top:8px;line-height:1.5}
  .mat .mat-hint a{color:var(--red);font-weight:600;text-decoration:underline;text-underline-offset:2px}

  @media(max-width:640px){
    .mat .mat-card{padding:24px 16px}
    .mat .mat-row{grid-template-columns:1fr}
    .mat .mat-upload{padding:28px 16px}
  }
  @media(prefers-reduced-motion:reduce){
    .mat .mat-submit,.mat .mat-success-actions a{transition:none}
  }
`

const TRUST = [
  "Resposta em até 48h",
  "Vagas limitadas por categoria",
  "Sem taxa para se inscrever",
]

export default async function MatriculaPage() {
  const config = await getConfig()
  const waDigits = config.whatsapp?.replace(/\D/g, "") ?? ""
  const whatsappUrl =
    waDigits.length >= 10
      ? `https://wa.me/${waDigits}?text=${encodeURIComponent(
          "Olá! Enviei a pré-matrícula e gostaria de mais informações sobre a escolinha.",
        )}`
      : null

  return (
    <PaginaPublica
      titulo="Pré-matrícula"
      descricao="Reserve a vaga do seu filho na escolinha. Em até 48h a equipe confirma a vaga e explica mensalidade, horários e documentos."
      largura="leitura"
      className="mat"
      complemento={
        <ul className="mat-trust">
          {TRUST.map((t) => (
            <li key={t} className="mat-trust-item">
              <Check size={16} strokeWidth={2.5} aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      }
    >
      <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="mat-card">
          <div className="mat-form-hdr">
            <div className="mat-form-title">Dados para a inscrição</div>
            <div className="mat-form-sub">
              Campos com * são obrigatórios.{" "}
              <span className="mat-hint" style={{ display: "inline", margin: 0 }}>
                Em dúvida sobre a categoria?{" "}
                <Link href="/horarios">Ver turmas e horários</Link>
              </span>
            </div>
          </div>
          <MatriculaForm whatsappUrl={whatsappUrl} />
        </div>
    </PaginaPublica>
  )
}
