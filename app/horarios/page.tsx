import Image from "next/image"
import Link from "next/link"
import { getTurmasHorarios } from "@/lib/landing/turmas"
import { getConfig } from "@/lib/config"
import { Inter, Playfair_Display } from "next/font/google"
import HorariosClient from "./horarios-client"

export const metadata = { title: "Turmas & Horários — E.C. Itaquerense" }

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-body" })
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700", "800", "900"], variable: "--font-heading" })

const css = `
  .hp{
    --red:#C62828;--red-dark:#9F1D1D;--red-darker:#7F0000;--red-deep:#4A0B0B;--red-warm:#D84040;
    --white:#fff;--bg:#FAF8F5;--bg-card:#fff;--bg-muted:#F3EFE9;
    --text:#1A1A2E;--text-muted:#6B6B7B;--text-light:#9696A0;
    --border:#E8E2DA;
    --shadow-sm:0 2px 8px rgba(26,26,46,.07);
    --shadow-md:0 8px 28px rgba(26,26,46,.12);
    --shadow-red:0 8px 28px rgba(198,40,40,.22);
    --radius-md:12px;--radius-lg:18px;--radius-xl:24px;
    --ease:cubic-bezier(.25,.46,.45,.94);
    font-family:var(--font-body),Arial,sans-serif;
    color:var(--text);background:var(--bg);
    -webkit-font-smoothing:antialiased;min-height:100vh;overflow-x:clip;
  }
  .hp *{margin:0;padding:0;box-sizing:border-box}
  .hp a{text-decoration:none;color:inherit}
  .hp ul{list-style:none}
  .hp .container{max-width:1060px;margin:0 auto;padding:0 24px}

  /* HEADER */
  .hp header{position:sticky;top:0;z-index:200;
    background:rgba(255,255,255,.95);backdrop-filter:blur(12px);
    border-bottom:1px solid var(--border);box-shadow:0 1px 0 var(--border),var(--shadow-sm)}
  .hp .hrow{display:flex;align-items:center;height:74px;gap:16px}
  .hp .brand{display:flex;align-items:center;gap:12px;flex-shrink:0}
  .hp .brand .bname b{display:block;font-size:18px;font-weight:700;color:var(--red);letter-spacing:.2px}
  .hp .brand .bname span{font-size:10px;color:var(--text-light);letter-spacing:2.5px;text-transform:uppercase;font-weight:500}
  .hp .hactions{margin-left:auto;display:flex;align-items:center;gap:10px}
  .hp .btn-ghost{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;
    color:var(--text-muted);padding:8px 16px;border-radius:100px;
    border:1px solid var(--border);transition:all .2s var(--ease)}
  .hp .btn-ghost:hover{background:var(--bg-muted);color:var(--text)}
  .hp .btn-mat{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;
    text-transform:uppercase;letter-spacing:.6px;color:#fff;background:var(--red);
    padding:9px 20px;border-radius:100px;transition:all .2s var(--ease)}
  .hp .btn-mat:hover{background:var(--red-warm);transform:translateY(-1px);box-shadow:var(--shadow-red)}
  @media(max-width:520px){.hp .btn-mat span{display:none}}

  /* HERO */
  .hp .hero{background:linear-gradient(135deg,var(--red-deep) 0%,var(--red) 55%,var(--red-dark) 100%);
    color:#fff;position:relative;overflow:hidden;padding:80px 0 88px}
  .hp .hero::before{content:'';position:absolute;inset:0;
    background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='rgba(255,255,255,.06)' stroke-width='1'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3Cline x1='0' y1='30' x2='60' y2='30'/%3E%3Cline x1='30' y1='0' x2='30' y2='60'/%3E%3C/g%3E%3C/svg%3E");
    background-size:60px 60px}
  .hp .hero-inner{position:relative;z-index:1}
  .hp .hero-badge{display:inline-flex;align-items:center;gap:7px;
    background:rgba(255,255,255,.15);color:#fff;font-size:11px;font-weight:700;
    letter-spacing:1.5px;text-transform:uppercase;padding:6px 14px;border-radius:100px;
    border:1px solid rgba(255,255,255,.3);margin-bottom:22px}
  .hp .hero h1{font-family:var(--font-heading),Georgia,serif;font-size:54px;font-weight:900;
    line-height:1.05;letter-spacing:-1px;margin-bottom:16px;max-width:700px}
  .hp .hero h1 em{font-style:normal;opacity:.75}
  .hp .hero p{font-size:17px;opacity:.88;max-width:500px;line-height:1.65;font-weight:400}
  .hp .hero-deco{position:absolute;right:-60px;top:-60px;width:440px;height:440px;border-radius:50%;
    background:radial-gradient(circle,rgba(255,255,255,.08) 0%,transparent 70%)}
  .hp .hero-deco2{position:absolute;left:-80px;bottom:-80px;width:300px;height:300px;border-radius:50%;
    background:radial-gradient(circle,rgba(255,255,255,.05) 0%,transparent 70%)}
  @media(max-width:640px){
    .hp .hero{padding:56px 0 64px}
    .hp .hero h1{font-size:36px;letter-spacing:-.5px}
    .hp .hero p{font-size:15px}
  }

  /* SECTION */
  .hp .section{padding:48px 0 80px}

  /* FOOTER */
  .hp .foot{border-top:1px solid var(--border);padding:28px 0}
  .hp .foot .container{display:flex;align-items:center;justify-content:space-between;
    font-size:12px;color:var(--text-light);flex-wrap:wrap;gap:10px}
  .hp .foot a{color:var(--text-muted);font-weight:600;transition:color .2s}
  .hp .foot a:hover{color:var(--red)}
`

export default async function HorariosPage() {
  const [turmas, config] = await Promise.all([getTurmasHorarios(), getConfig()])
  const waNumber = config.whatsapp?.replace(/\D/g, "") || "5511999999999"
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Olá! Gostaria de saber sobre as turmas e horários da Escolinha Itaquerense.")}`

  return (
    <div className={`${inter.variable} ${playfair.variable} hp`}>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.1.0/dist/tabler-icons.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* HEADER */}
      <header>
        <div className="container hrow">
          <Link className="brand" href="/">
            <Image src="/logo.png" alt="E.C. Itaquerense" width={46} height={46} />
            <span className="bname"><b>E.C. Itaquerense</b><span>Site Oficial</span></span>
          </Link>
          <div className="hactions">
            <Link className="btn-ghost" href="/">
              <i className="ti ti-arrow-left"></i> Início
            </Link>
            <Link className="btn-mat" href="/matricula">
              <i className="ti ti-user-plus"></i>
              <span>Matricular</span>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <div className="hero">
        <div className="hero-deco" />
        <div className="hero-deco2" />
        <div className="container hero-inner">
          <div className="hero-badge">
            <i className="ti ti-calendar-time"></i>
            Temporada 2026
          </div>
          <h1>Turmas <em>&amp;</em><br />Horários</h1>
          <p>Escolha a modalidade e a faixa etária certa para o seu filho e dê o primeiro passo na formação esportiva do E.C. Itaquerense.</p>
        </div>
      </div>

      {/* CONTEÚDO INTERATIVO */}
      <section className="section">
        <div className="container">
          <HorariosClient turmas={turmas} waUrl={waUrl} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot">
        <div className="container">
          <span>© 2026 E.C. Itaquerense. Todos os direitos reservados.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/matricula">Pré-Matrícula</Link>
            <Link href="/resultados">Resultados</Link>
            <Link href="/responsavel">Portal do Responsável</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
