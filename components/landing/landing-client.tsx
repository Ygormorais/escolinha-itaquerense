"use client"
import { useState } from "react"
import Image from "next/image"
import { Inter, Playfair_Display } from "next/font/google"
import Link from "next/link"
import { NoticiasCarrossel } from "./noticias-carrossel"
import { NoticiasClubCarrossel } from "./noticias-clube-carrossel"
import type { HeroView } from "@/lib/landing/jogos"
import type { NoticiaCard } from "@/lib/landing/noticias"
import type { NoticiaClube } from "./noticias-clube-carrossel"
import type { SobreConteudo, FotoGaleria, Depoimento } from "@/lib/landing/conteudo"
import { temSobre, temGaleria, temDepoimentos } from "@/lib/landing/conteudo"

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-heading",
})

const css = `
  .lp{
    --red:#C62828;
    --red-dark:#9F1D1D;
    --red-darker:#7F0000;
    --red-deep:#4A0B0B;
    --red-warm:#D84040;
    --white:#FFFFFF;
    --bg:#FAF8F5;
    --bg-card:#FFFFFF;
    --bg-muted:#F3EFE9;
    --text:#1A1A2E;
    --text-muted:#6B6B7B;
    --text-light:#9696A0;
    --border:#E8E2DA;
    --shadow-sm:0 2px 8px rgba(26,26,46,.08);
    --shadow-md:0 4px 20px rgba(26,26,46,.10);
    --shadow-hover:0 12px 36px rgba(198,40,40,.18);
    --radius-sm:8px;
    --radius-md:12px;
    --radius-lg:18px;
    --transition:all 0.25s ease;
  }
  .lp *{margin:0;padding:0;box-sizing:border-box}
  .lp{font-family:var(--font-body),Arial,sans-serif;color:var(--text);background:var(--bg);line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased;width:100%;overflow-x:clip}
  .lp a{text-decoration:none;color:inherit}
  .lp ul{list-style:none}
  .lp img{max-width:100%;display:block}
  .lp .container{max-width:1240px;margin:0 auto;padding:0 24px}
  .lp .section-title{font-family:var(--font-heading),Georgia,serif;font-size:26px;font-weight:700;color:var(--text);border-left:4px solid var(--red);padding-left:14px;margin-bottom:32px;line-height:1.2}
  .lp .btn{display:inline-block;font-family:var(--font-body),sans-serif;text-transform:uppercase;letter-spacing:.8px;font-weight:700;font-size:13px;padding:14px 32px;border-radius:var(--radius-sm);cursor:pointer;border:2px solid transparent;transition:var(--transition)}
  .lp .btn-white{background:var(--white);color:var(--red)}
  .lp .btn-white:hover{background:transparent;color:var(--white);border-color:var(--white)}
  .lp .shield{width:46px;height:46px;object-fit:contain;flex-shrink:0}
  @keyframes wa-pulse{0%,100%{box-shadow:0 4px 16px rgba(37,211,102,.4)}50%{box-shadow:0 4px 24px rgba(37,211,102,.7),0 0 0 8px rgba(37,211,102,.12)}}
  .lp header.site{position:sticky;top:0;z-index:1000;background:rgba(255,255,255,.97);backdrop-filter:blur(8px);box-shadow:0 1px 0 var(--border), var(--shadow-sm)}
  .lp .header-row{display:flex;align-items:center;height:76px;gap:14px;overflow:hidden}
  .lp .header-row nav.main{flex:1;min-width:0;overflow:hidden;order:1}
  .lp .header-row .access{order:2}
  .lp .header-row .burger{order:3}
  .lp .brand{display:flex;align-items:center;gap:14px;flex-shrink:0}
  .lp .brand .shield{width:52px;height:52px}
  .lp .brand .name{font-family:var(--font-body),sans-serif;line-height:1.1}
  .lp .brand .name b{display:block;font-size:19px;font-weight:700;color:var(--red);letter-spacing:.3px}
  .lp .brand .name span{font-size:10px;color:var(--text-light);letter-spacing:2.5px;text-transform:uppercase;font-weight:500}
  .lp nav.main>ul{display:flex;align-items:center}
  .lp nav.main>ul>li{position:relative}
  .lp nav.main>ul>li>a{display:block;padding:28px 14px;font-family:var(--font-body),sans-serif;text-transform:uppercase;letter-spacing:.6px;font-weight:600;font-size:13px;color:var(--text);transition:var(--transition)}
  .lp nav.main>ul>li:hover>a{color:var(--red)}
  .lp nav.main>ul>li>a::after{content:'';position:absolute;left:14px;right:14px;bottom:20px;height:2px;background:var(--red);transform:scaleX(0);transition:var(--transition);border-radius:2px}
  .lp nav.main>ul>li:hover>a::after{transform:scaleX(1)}
  .lp .burger{display:none;font-size:26px;color:var(--red);background:none;border:none;cursor:pointer}
  .lp nav.main>ul>li.nav-access{display:none}
  .lp .hero{background:radial-gradient(ellipse at 80% 10%, rgba(255,255,255,.07) 0%, transparent 60%),linear-gradient(135deg, var(--red-deep) 0%, var(--red) 50%, var(--red-dark) 100%);color:#fff;position:relative;overflow:hidden}
  .lp .hero::before{content:'';position:absolute;right:-80px;top:-80px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle, rgba(255,255,255,.08) 0%, transparent 70%)}
  .lp .hero::after{content:'';position:absolute;left:-60px;bottom:-60px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle, rgba(255,255,255,.05) 0%, transparent 70%)}
  .lp .hero .container{position:relative;z-index:2;padding:84px 24px 96px;max-width:860px}
  .lp .badge{display:inline-block;background:rgba(255,255,255,.15);color:#fff;font-family:var(--font-body),sans-serif;text-transform:uppercase;font-weight:700;font-size:11px;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:22px;border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(4px)}
  .lp .hero h1{font-family:var(--font-heading),Georgia,serif;font-size:52px;font-weight:800;line-height:1.08;margin-bottom:20px;letter-spacing:-.5px}
  .lp .hero p{font-size:18px;opacity:.88;margin-bottom:32px;max-width:640px;line-height:1.65;font-weight:400}
  .lp section{padding:72px 0}
  .lp .membership{background:radial-gradient(ellipse at 20% 50%, rgba(255,255,255,.07) 0%, transparent 60%),linear-gradient(135deg,var(--red) 0%,var(--red-darker) 100%);color:#fff;text-align:center;position:relative;overflow:hidden}
  .lp .membership::after{content:'';position:absolute;right:-100px;top:-100px;width:400px;height:400px;border-radius:50%;background:rgba(255,255,255,.05)}
  .lp .membership .container{position:relative;z-index:1}
  .lp .membership h2{font-family:var(--font-heading),Georgia,serif;font-size:38px;font-weight:800;margin-bottom:14px;letter-spacing:-.5px}
  .lp .membership p{font-size:17px;opacity:.90;margin-bottom:30px;max-width:640px;margin-left:auto;margin-right:auto;line-height:1.65}
  .lp .cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  .lp .cat{text-align:center;padding:36px 20px;border-radius:var(--radius-lg);transition:var(--transition);cursor:pointer;border:1px solid transparent}
  .lp .cat:hover{background:var(--bg-card);transform:translateY(-6px);box-shadow:var(--shadow-md);border-color:var(--border)}
  .lp .cat .circle{width:88px;height:88px;border-radius:50%;background:linear-gradient(150deg,var(--red),var(--red-darker));display:flex;align-items:center;justify-content:center;color:#fff;font-size:38px;margin:0 auto 18px;box-shadow:0 6px 20px rgba(198,40,40,.30);transition:var(--transition)}
  .lp .cat:hover .circle{transform:scale(1.06)}
  .lp .cat b{font-family:var(--font-body),sans-serif;text-transform:uppercase;display:block;font-size:15px;font-weight:700;color:var(--text);margin-bottom:4px}
  .lp .cat span{font-size:13px;color:var(--text-muted)}
  .lp footer{background:var(--red-deep);color:#fff;padding-top:60px}
  .lp .foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:36px}
  .lp .foot-brand .shield{width:68px;height:68px;margin-bottom:16px}
  .lp .foot-brand p{font-size:13px;opacity:.78;margin-bottom:18px;max-width:280px;line-height:1.65}
  .lp footer h4{font-family:var(--font-body),sans-serif;text-transform:uppercase;font-size:11px;letter-spacing:1.5px;font-weight:700;margin-bottom:16px;color:rgba(255,255,255,.6)}
  .lp footer .fcol a{display:block;font-size:13px;opacity:.75;padding:6px 0;transition:var(--transition)}
  .lp footer .fcol a:hover{opacity:1;color:#FFCDD2;padding-left:6px}
  .lp .foot-bottom{border-top:1px solid rgba(255,255,255,.12);margin-top:48px;padding:20px 0}
  .lp .foot-bottom .container{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:10px;font-size:12px;opacity:.7}
  @media(max-width:900px){
    .lp nav.main{position:fixed;top:76px;left:0;right:0;background:#fff;flex-direction:column;max-height:0;overflow:hidden;box-shadow:0 10px 24px rgba(26,26,46,.18);transition:max-height .35s ease}
    .lp nav.main.open{max-height:80vh;overflow:auto}
    .lp nav.main>ul{flex-direction:column;align-items:stretch}
    .lp nav.main>ul>li>a{padding:16px 20px;border-bottom:1px solid var(--border)}
    .lp nav.main>ul>li>a::after{display:none}
    .lp nav.main>ul>li.nav-access{display:block}
    .lp .burger{display:block}
    .lp .cat-grid{grid-template-columns:repeat(2,1fr)}
    .lp .foot-grid{grid-template-columns:1fr 1fr}
    .lp .hero h1{font-size:38px}
    .lp section{padding:56px 0}
  }
  @media(max-width:600px){
    .lp .cat-grid{grid-template-columns:repeat(2,1fr)}
    .lp .foot-grid{grid-template-columns:1fr}
    .lp .foot-bottom .container{flex-direction:column;text-align:center}
    .lp .hero h1{font-size:30px}
    .lp .hero .container{padding:60px 20px 72px}
    .lp section{padding:44px 0}
    .lp .membership h2{font-size:28px}
  }
  @media(max-width:320px){
    .lp .hero h1{font-size:26px}
    .lp .btn{padding:12px 22px;font-size:12px}
    .lp .container{padding:0 14px}
  }
  .lp .access{display:flex;align-items:center;gap:8px;flex-shrink:0}
  .lp .btn-access{font-family:var(--font-body),sans-serif;text-transform:uppercase;letter-spacing:.6px;font-weight:700;font-size:12px;padding:9px 16px;border-radius:100px;border:2px solid var(--red);color:var(--red);display:flex;align-items:center;gap:6px;transition:var(--transition)}
  .lp .btn-access:hover{background:var(--red);color:#fff}
  .lp .btn-access.primary{background:var(--red);color:#fff}
  .lp .btn-access.primary:hover{background:var(--red-warm);border-color:var(--red-warm);transform:translateY(-1px);box-shadow:0 6px 20px rgba(198,40,40,.35)}
  /* No mobile: só Matrícula (primary) fica no header; Portal/Entrar migram para o menu via .nav-access */
  @media(max-width:900px){.lp .access .btn-access{display:none}.lp .access .btn-access.primary{display:flex}}
  .lp .jc{background:var(--red-deep);color:#fff;padding:40px 0}
  .lp .jc .section-title{color:#fff;border-left-color:#fff;margin-bottom:20px}
  .lp .jc-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
  .lp .jc-tab{font-family:var(--font-body),sans-serif;text-transform:uppercase;letter-spacing:.6px;font-weight:700;font-size:12px;padding:8px 18px;border-radius:100px;border:2px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer;transition:var(--transition)}
  .lp .jc-tab:hover{border-color:rgba(255,255,255,.55)}
  .lp .jc-tab.active{background:#fff;color:var(--red);border-color:#fff}
  .lp .jc-track{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:6px}
  .lp .jc-card{scroll-snap-align:start;flex:0 0 280px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:var(--radius-md);padding:18px;transition:var(--transition)}
  .lp .jc-card.focus{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.4)}
  .lp .jc-comp{font-family:var(--font-body),sans-serif;text-transform:uppercase;font-size:11px;letter-spacing:.8px;font-weight:600;opacity:.8;margin-bottom:10px}
  .lp .jc-match{display:flex;align-items:center;gap:12px;margin-bottom:10px}
  .lp .jc-badge{width:34px;height:34px;object-fit:contain}
  .lp .jc-score{font-family:var(--font-heading),Georgia,serif;font-size:28px;font-weight:800;letter-spacing:-1px}
  .lp .jc-adv{font-weight:700}
  .lp .jc-foot{display:flex;align-items:center;justify-content:space-between;font-size:13px;opacity:.9}
  .lp .jc-sumula{font-weight:700;text-decoration:underline}
  .lp .jc-empty{display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;padding:18px 0 6px}
  .lp .jc-empty .jc-badge{width:48px;height:48px;opacity:.95}
  .lp .jc-empty p{max-width:460px;font-size:15px;opacity:.92;line-height:1.5}
  .lp .sobre .container{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center}
  .lp .sobre .txt p{color:var(--text-muted);margin-bottom:14px;line-height:1.7}
  .lp .sobre .txt p:last-child{margin-bottom:0}
  .lp .sobre .foto{border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-md)}
  .lp .sobre .foto img{width:100%;height:100%;object-fit:cover}
  @media(max-width:900px){.lp .sobre .container{grid-template-columns:1fr;gap:28px}}
  .lp .galeria{background:var(--bg-muted)}
  .lp .galeria .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .lp .galeria .item{aspect-ratio:4/3;border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-sm);transition:var(--transition)}
  .lp .galeria .item:hover{transform:translateY(-4px);box-shadow:var(--shadow-md)}
  .lp .galeria .item img{width:100%;height:100%;object-fit:cover}
  @media(max-width:900px){.lp .galeria .grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:600px){.lp .galeria .grid{grid-template-columns:1fr}}
  .lp .depo .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  .lp .depo .card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:28px;box-shadow:var(--shadow-sm)}
  .lp .depo .quote{font-family:var(--font-heading),Georgia,serif;color:var(--red);font-size:40px;line-height:1;margin-bottom:8px}
  .lp .depo .texto{color:var(--text);line-height:1.7;margin-bottom:18px}
  .lp .depo .autor b{display:block;font-size:14px;font-weight:700}
  .lp .depo .autor span{font-size:12px;color:var(--text-muted)}
  @media(max-width:900px){.lp .depo .grid{grid-template-columns:1fr}}
  .lp .modalidades{border-top:1px solid var(--border)}
`

export function LandingClient({
  noticias,
  noticiasClube,
  whatsapp,
  hero,
  sobre,
  galeria,
  depoimentos,
}: {
  noticias: NoticiaCard[]
  noticiasClube: NoticiaClube[]
  whatsapp?: string
  hero: HeroView
  sobre: SobreConteudo | null
  galeria: FotoGaleria[]
  depoimentos: Depoimento[]
}) {
  const [navOpen, setNavOpen] = useState(false)
  const waNumber = whatsapp?.replace(/\D/g, "") || "5511999999999"
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Olá! Gostaria de mais informações sobre a Escolinha Itaquerense.")}`

  return (
    <div className={`${inter.variable} ${playfair.variable} lp`}>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.1.0/dist/tabler-icons.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ===== 1. STICKY HEADER ===== */}
      <header className="site">
        <div className="container header-row">
          <Link className="brand" href="/">
            <Image className="shield" src="/logo.png" alt="E.C. Itaquerense" width={52} height={52} />
            <span className="name"><b>E.C. Itaquerense</b><span>Site Oficial</span></span>
          </Link>

          <div className="access">
            <a href="/matricula" className="btn-access primary">Matrícula</a>
            <a href="/responsavel" className="btn-access">Portal do Responsável</a>
            <a href="/login" className="btn-access" aria-label="Área administrativa"><i className="ti ti-lock"></i> Entrar</a>
          </div>

          <button className="burger" aria-label="Menu" aria-expanded={navOpen} aria-controls="nav" onClick={() => setNavOpen(o => !o)}><i className="ti ti-menu-2"></i></button>

          <nav className={"main" + (navOpen ? " open" : "")} id="nav">
            <ul>
              <li><a href="/horarios">Turmas &amp; Horários</a></li>
              <li><a href="#noticias">Destaques</a></li>
              <li><a href="/resultados">Resultados</a></li>
              <li className="nav-access"><a href="/responsavel">Portal do Responsável</a></li>
              <li className="nav-access"><a href="/login">Entrar</a></li>
            </ul>
          </nav>

        </div>
      </header>

      {/* ===== 2. HERO (conteúdo real vindo do servidor) ===== */}
      <div className="hero">
        <div className="container">
          <span className="badge">{hero.badge}</span>
          <h1>{hero.titulo}</h1>
          <p>{hero.descricao}</p>
          <a href={hero.ctaHref} className="btn btn-white">{hero.ctaLabel}</a>
        </div>
      </div>

      {/* ===== 3. DESTAQUES (jogos/resultados) ===== */}
      <div id="noticias">
        <NoticiasCarrossel items={noticias} />
      </div>

      {/* ===== 4. NOTÍCIAS DO CLUBE ===== */}
      {noticiasClube.length > 0 && (
        <NoticiasClubCarrossel items={noticiasClube} />
      )}

      <section>
        <div className="container">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
            <div>
              <h2 className="section-title" style={{ marginBottom: "10px" }}>Acompanhe o clube</h2>
              <p style={{ color: "var(--text-muted)", maxWidth: "640px", lineHeight: 1.7 }}>
                Veja noticias, horarios, resultados e os principais movimentos da escolinha em um fluxo unico e sempre atualizado.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Link href="/noticias" className="btn-access primary">Notícias</Link>
              <Link href="/resultados" className="btn-access">Resultados</Link>
              <Link href="/horarios" className="btn-access">Horários</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Sobre / História (guardado) ===== */}
      {temSobre() && sobre && (
        <section className="sobre">
          <div className="container">
            <div className="txt">
              <h2 className="section-title">{sobre.titulo}</h2>
              {sobre.paragrafos.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {sobre.foto && (
              <div className="foto">
                <Image src={sobre.foto} alt={sobre.titulo} width={560} height={420} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ===== Galeria (guardado) ===== */}
      {temGaleria() && (
        <section className="galeria">
          <div className="container">
            <h2 className="section-title">Galeria</h2>
            <div className="grid">
              {galeria.map((f, i) => (
                <div className="item" key={i}>
                  <Image src={f.src} alt={f.alt} width={400} height={300} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Depoimentos (guardado) ===== */}
      {temDepoimentos() && (
        <section className="depo">
          <div className="container">
            <h2 className="section-title">O que dizem os pais</h2>
            <div className="grid">
              {depoimentos.map((d, i) => (
                <div className="card" key={i}>
                  <div className="quote" aria-hidden="true">&ldquo;</div>
                  <p className="texto">{d.texto}</p>
                  <div className="autor">
                    <b>{d.autor}</b>
                    {d.categoria && <span>{d.categoria}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 4. MEMBERSHIP BANNER ===== */}
      <section className="membership">
        <div className="container">
          <h2>Matricule-se na Escolinha</h2>
          <p>Garanta a vaga do seu filho, acompanhe tudo pelo portal do responsável e viva o dia a dia do E.C. Itaquerense. Faça parte da nossa história.</p>
          <a href="/matricula" className="btn btn-white">Fazer Matrícula</a>
        </div>
      </section>

      {/* ===== 5. MODALIDADES ===== */}
      <section className="modalidades">
        <div className="container">
          <h2 className="section-title">Modalidades</h2>
          <div className="cat-grid">
            <a className="cat" href="/horarios"><div className="circle"><i className="ti ti-ball-football"></i></div><b>Futebol</b><span>Masculino &amp; Feminino</span></a>
            <a className="cat" href="/horarios"><div className="circle"><i className="ti ti-ball-football"></i></div><b>Futsal Federado</b><span>Liga Local</span></a>
            <a className="cat" href="/horarios"><div className="circle"><i className="ti ti-school"></i></div><b>Escolinha</b><span>Formação de Base</span></a>
          </div>
        </div>
      </section>

      {/* ===== 6. FOOTER ===== */}
      <footer>
        <div className="container foot-grid">
          <div className="foot-brand">
            <Image className="shield" src="/logo.png" alt="E.C. Itaquerense" width={68} height={68} />
            <p>E.C. Itaquerense — site oficial. Tradição, paixão e formação esportiva em cada modalidade. Vamos juntos por mais conquistas.</p>
          </div>
          <div className="fcol"><h4>Futebol</h4><a href="/horarios">Turmas &amp; Horários</a><a href="/resultados">Resultados &amp; Classificação</a></div>
          <div className="fcol"><h4>Serviços</h4><a href="/matricula">Pré-Matrícula</a><a href="/responsavel">Portal do Responsável</a></div>
        </div>
        <div className="foot-bottom">
          <div className="container">
            <span>© 2026 E.C. Itaquerense. Todos os direitos reservados.</span>
          </div>
        </div>
      </footer>

      {/* Botão flutuante WhatsApp */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Fale conosco pelo WhatsApp"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#25D366",
          boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
          animation: "wa-pulse 2.5s ease-in-out infinite",
          textDecoration: "none",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  )
}
