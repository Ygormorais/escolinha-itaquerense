import Link from "next/link"
import Image from "next/image"
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
  .hp-hdr{
    background:linear-gradient(135deg,#4A0B0B 0%,#C62828 60%,#9F1D1D 100%);
    color:#fff;position:sticky;top:0;z-index:100;
    box-shadow:0 2px 16px rgba(0,0,0,.28)
  }
  .hp-hdr .inner{
    max-width:1060px;margin:0 auto;padding:0 24px;
    display:flex;align-items:center;height:68px;gap:14px
  }
  .hp-hdr .brand{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
  .hp-hdr .brand-name{
    font-family:var(--font-heading),Georgia,serif;font-size:17px;
    font-weight:800;letter-spacing:-.3px;white-space:nowrap
  }
  .hp-hdr .brand-sub{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1.5px;font-weight:500}
  .hp-hdr .back{
    font-size:12px;font-weight:600;opacity:.85;color:#fff;
    border:1px solid rgba(255,255,255,.3);border-radius:6px;
    padding:6px 14px;white-space:nowrap;flex-shrink:0;transition:background .2s
  }
  .hp-hdr .back:hover{background:rgba(255,255,255,.15);opacity:1}

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
      <header className="hp-hdr">
        <div className="inner">
          <Link href="/" className="brand">
            <Image src="/logo.png" alt="E.C. Itaquerense" width={40} height={40} style={{ borderRadius: 8, flexShrink: 0 }} />
            <div>
              <div className="brand-name">E.C. Itaquerense</div>
              <div className="brand-sub">Turmas &amp; Horários</div>
            </div>
          </Link>
          <Link href="/" className="back">← Voltar ao site</Link>
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
