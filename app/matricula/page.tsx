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
  .mat .pub-hdr .inner{max-width:680px}

  /* HERO */
  .mat-hero{
    background:linear-gradient(180deg,rgba(74,11,11,.06) 0%,transparent 100%);
    border-bottom:1px solid var(--border);padding:44px 24px 36px;
    position:relative;overflow:hidden
  }
  .mat-hero::before{
    content:'';position:absolute;inset:0;pointer-events:none;opacity:.04;
    background-image:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23C62828' stroke-width='1'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3Cline x1='0' y1='30' x2='60' y2='30'/%3E%3Cline x1='30' y1='0' x2='30' y2='60'/%3E%3C/g%3E%3C/svg%3E");
    background-size:60px 60px
  }
  .mat-hero .inner{max-width:680px;margin:0 auto;position:relative;z-index:1}
  .mat-hero .season{display:inline-block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;background:rgba(198,40,40,.1);color:var(--red);border:1px solid rgba(198,40,40,.2);border-radius:100px;padding:4px 12px;margin-bottom:14px}
  .mat-hero h1{font-family:var(--font-heading),Georgia,serif;font-size:34px;font-weight:800;letter-spacing:-1px;color:var(--text);margin-bottom:8px}
  .mat-hero p{font-size:15px;color:var(--text-muted);line-height:1.6;max-width:520px}

  /* DIFERENCIAIS */
  .mat-difs{max-width:680px;margin:0 auto;padding:32px 24px 0;display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
  .mat-dif{background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;display:flex;align-items:flex-start;gap:12px;box-shadow:0 1px 4px rgba(26,26,46,.05)}
  .mat-dif .icon{font-size:22px;line-height:1;flex-shrink:0}
  .mat-dif .titulo{font-size:13px;font-weight:700;color:var(--text);margin-bottom:2px}
  .mat-dif .desc{font-size:11px;color:var(--text-muted);line-height:1.4}

  /* FORM */
  .mat-body{max-width:680px;margin:0 auto;padding:32px 24px 80px}
  .mat-card{background:#fff;border:1px solid var(--border);border-radius:16px;padding:36px;box-shadow:0 2px 12px rgba(26,26,46,.06)}
  .mat-card-title{font-family:var(--font-heading),Georgia,serif;font-size:20px;font-weight:800;color:var(--text);margin-bottom:4px}
  .mat-card-sub{font-size:13px;color:var(--text-muted);margin-bottom:28px}

  /* FOOTER */
  .mat-foot{border-top:1px solid var(--border);padding:24px}
  .mat-foot .inner{max-width:680px;margin:0 auto;display:flex;justify-content:center;gap:24px;flex-wrap:wrap}
  .mat-foot a{font-size:13px;font-weight:600;color:var(--red);opacity:.8;transition:opacity .2s}
  .mat-foot a:hover{opacity:1}

  @media(max-width:600px){
    .mat-hero h1{font-size:26px}
    .mat-difs{grid-template-columns:1fr}
    .mat-card{padding:24px}
  }
`

const DIFERENCIAIS = [
  { icon: "⚽", titulo: "Metodologia por faixa etária", desc: "Do Sub-7 ao Sub-18, treinamentos adaptados à fase do atleta." },
  { icon: "🏅", titulo: "Competições oficiais FPFS", desc: "Participação em campeonatos federados na região de SP." },
  { icon: "👨‍🏫", titulo: "Comissão técnica experiente", desc: "Treinadores dedicados ao desenvolvimento completo do aluno." },
  { icon: "🤝", titulo: "Valores além do esporte", desc: "Disciplina, respeito e trabalho em equipe como pilares." },
]

export default function MatriculaPage() {
  return (
    <div className={`mat ${inter.variable} ${playfair.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <PublicHeader subtitle="Pré-Matrícula" />

      <div className="mat-hero">
        <div className="inner">
          <div className="season">Temporada 2026</div>
          <h1>Pré-Matrícula</h1>
          <p>Preencha os dados abaixo e entraremos em contato em até 48h para confirmar a vaga e passar as informações sobre mensalidade e documentação.</p>
        </div>
      </div>

      <div className="mat-difs">
        {DIFERENCIAIS.map((d) => (
          <div key={d.titulo} className="mat-dif">
            <span className="icon">{d.icon}</span>
            <div>
              <div className="titulo">{d.titulo}</div>
              <div className="desc">{d.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mat-body">
        <div className="mat-card">
          <div className="mat-card-title">Formulário de Inscrição</div>
          <div className="mat-card-sub">Campos com * são obrigatórios</div>
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
