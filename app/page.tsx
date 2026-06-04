"use client"
import { useState } from "react"
import Image from "next/image"
import { Roboto, Roboto_Condensed } from "next/font/google"
import Link from "next/link"

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
})

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading",
})

const css = `
  .lp{
    --red:#C62828;
    --red-dark:#9F1D1D;
    --red-darker:#7F0000;
    --red-deep:#4A0B0B;
    --white:#FFFFFF;
    --text:#222222;
    --gray-bg:#F2F2F2;
    --gray-line:#e3e3e3;
  }
  .lp *{margin:0;padding:0;box-sizing:border-box}
  .lp{font-family:var(--font-body),Arial,sans-serif;color:#222;background:#fff;line-height:1.5}
  .lp a{text-decoration:none;color:inherit}
  .lp ul{list-style:none}
  .lp img{max-width:100%;display:block}
  .lp .container{max-width:1240px;margin:0 auto;padding:0 20px}
  .lp .label{font-family:var(--font-heading),sans-serif;text-transform:uppercase;letter-spacing:.5px}
  .lp .section-title{font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-size:22px;font-weight:700;color:var(--red);border-left:5px solid var(--red);padding-left:12px;margin-bottom:22px}
  .lp .btn{display:inline-block;font-family:var(--font-heading),sans-serif;text-transform:uppercase;letter-spacing:.5px;font-weight:700;font-size:14px;padding:12px 26px;border-radius:4px;cursor:pointer;border:2px solid transparent;transition:.2s}
  .lp .btn-white{background:var(--white);color:var(--red)}
  .lp .btn-white:hover{background:transparent;color:var(--white);border-color:var(--white)}
  .lp .btn-red{background:var(--red);color:var(--white)}
  .lp .btn-red:hover{background:var(--red-darker)}
  .lp .placeholder{display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.55);font-size:42px}
  .lp .shield{width:46px;height:46px;object-fit:contain;flex-shrink:0}
  .lp .mb-badge{width:44px;height:44px;object-fit:contain;background:#fff;border-radius:8px;padding:3px}
  .lp .utility{background:var(--red-deep);color:#fff;font-size:12px}
  .lp .utility .container{display:flex;justify-content:space-between;align-items:center;height:38px;gap:16px}
  .lp .utility ul{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
  .lp .utility .quick a{display:flex;align-items:center;gap:6px;opacity:.9;transition:.2s}
  .lp .utility .quick a:hover{opacity:1;color:#ffd6d6}
  .lp .live-dot{width:9px;height:9px;border-radius:50%;background:#ff3b3b;display:inline-block;animation:blink 1s infinite}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
  .lp .utility .social{gap:14px;font-size:15px}
  .lp .utility .social a:hover{color:#ffd6d6}
  .lp header.site{position:sticky;top:0;z-index:1000;background:var(--white);box-shadow:0 2px 8px rgba(0,0,0,.12)}
  .lp .header-row{display:flex;align-items:center;height:72px;gap:12px;overflow:hidden}
  .lp .header-row nav.main{flex:1;min-width:0;overflow:hidden}
  .lp .brand{display:flex;align-items:center;gap:12px;flex-shrink:0}
  .lp .brand .shield{width:50px;height:50px}
  .lp .brand .name{font-family:var(--font-heading),sans-serif;text-transform:uppercase;line-height:1}
  .lp .brand .name b{display:block;font-size:21px;color:var(--red);letter-spacing:.5px}
  .lp .brand .name span{font-size:11px;color:#888;letter-spacing:2px}
  .lp nav.main>ul{display:flex;align-items:center}
  .lp nav.main>ul>li{position:relative}
  .lp nav.main>ul>li>a{display:block;padding:26px 13px;font-family:var(--font-heading),sans-serif;text-transform:uppercase;letter-spacing:.5px;font-weight:700;font-size:14px;color:var(--text);transition:.2s}
  .lp nav.main>ul>li:hover>a{color:var(--red)}
  .lp nav.main>ul>li>a::after{content:'';position:absolute;left:13px;right:13px;bottom:18px;height:2px;background:var(--red);transform:scaleX(0);transition:.2s}
  .lp nav.main>ul>li:hover>a::after{transform:scaleX(1)}
  .lp .mega{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(10px);background:var(--white);min-width:520px;box-shadow:0 14px 34px rgba(0,0,0,.18);border-top:3px solid var(--red);padding:24px;opacity:0;visibility:hidden;transition:.2s;display:grid;grid-template-columns:repeat(2,1fr);gap:10px 30px;border-radius:0 0 6px 6px}
  .lp nav.main>ul>li:hover .mega{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}
  .lp .mega.small{min-width:300px;grid-template-columns:1fr}
  .lp .mega h4{font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-size:13px;color:var(--red);letter-spacing:.5px;margin-bottom:8px;border-bottom:1px solid var(--gray-line);padding-bottom:6px}
  .lp .mega a{display:block;padding:6px 0;font-size:14px;color:#444;transition:.2s}
  .lp .mega a:hover{color:var(--red);padding-left:6px}
  .lp .burger{display:none;font-size:26px;color:var(--red);background:none;border:none;cursor:pointer}
  .lp .hero{background:linear-gradient(120deg,var(--red-deep),var(--red) 55%,var(--red-dark));color:#fff;position:relative;overflow:hidden}
  .lp .hero::after{content:'';position:absolute;right:-120px;top:-120px;width:480px;height:480px;border-radius:50%;background:rgba(255,255,255,.06)}
  .lp .hero .container{position:relative;z-index:2;padding:70px 20px 80px;max-width:820px}
  .lp .badge{display:inline-block;background:#fff;color:var(--red);font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-weight:700;font-size:12px;letter-spacing:1px;padding:5px 12px;border-radius:3px;margin-bottom:18px}
  .lp .hero h1{font-family:var(--font-heading),sans-serif;font-size:46px;font-weight:700;line-height:1.1;text-transform:uppercase;margin-bottom:16px}
  .lp .hero p{font-size:18px;opacity:.92;margin-bottom:28px;max-width:620px}
  .lp .thumb-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:var(--red-deep)}
  .lp .thumb{position:relative;min-height:150px;display:flex;align-items:flex-end;padding:18px;color:#fff;overflow:hidden}
  .lp .thumb .placeholder{position:absolute;inset:0;font-size:54px}
  .lp .thumb .tag{position:absolute;top:14px;left:14px;background:var(--red);font-size:11px;font-weight:700;letter-spacing:.5px;padding:4px 9px;border-radius:3px;z-index:2}
  .lp .thumb h3{position:relative;z-index:2;font-family:var(--font-heading),sans-serif;font-size:16px;font-weight:700;line-height:1.2;text-shadow:0 2px 6px rgba(0,0,0,.5)}
  .lp .thumb:nth-child(1){background:linear-gradient(160deg,var(--red),var(--red-darker))}
  .lp .thumb:nth-child(2){background:linear-gradient(160deg,var(--red-dark),var(--red-deep))}
  .lp .thumb:nth-child(3){background:linear-gradient(160deg,#d11a1a,var(--red-dark))}
  .lp .thumb:hover .placeholder{transform:scale(1.08);transition:.4s}
  .lp .matchbar{background:var(--red-deep);color:#fff}
  .lp .matchbar .container{display:grid;grid-template-columns:repeat(3,1fr)}
  .lp .mb-cell{padding:22px 24px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;border-right:1px solid rgba(255,255,255,.12)}
  .lp .mb-cell:last-child{border-right:none}
  .lp .mb-comp{font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-size:12px;letter-spacing:.5px;opacity:.8}
  .lp .mb-match{display:flex;align-items:center;gap:14px}
  .lp .mb-score{font-family:var(--font-heading),sans-serif;font-size:30px;font-weight:700}
  .lp .mb-info{font-size:12px;opacity:.85}
  .lp section{padding:54px 0}
  .lp .news-grid{display:grid;grid-template-columns:2fr 1fr;gap:30px}
  .lp .news-main{display:grid;grid-template-columns:1fr 1fr;gap:22px}
  .lp .card{background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);transition:.25s;cursor:pointer}
  .lp .card:hover{transform:translateY(-6px);box-shadow:0 14px 30px rgba(198,40,40,.18)}
  .lp .card .media{min-height:200px;position:relative}
  .lp .card .tag{position:absolute;top:12px;left:12px;background:var(--red);color:#fff;font-size:11px;font-weight:700;letter-spacing:.5px;padding:4px 10px;border-radius:3px}
  .lp .card .body{padding:16px 18px}
  .lp .card .body h3{font-family:var(--font-heading),sans-serif;font-size:19px;font-weight:700;line-height:1.25;margin-bottom:8px}
  .lp .card:hover .body h3{color:var(--red)}
  .lp .card .date{font-size:12px;color:#999}
  .lp .featured{grid-column:1 / -1}
  .lp .featured .media{min-height:320px}
  .lp .featured .body h3{font-size:26px}
  .lp .news-main .media{background:linear-gradient(150deg,var(--red),var(--red-darker))}
  .lp .featured .media{background:linear-gradient(135deg,var(--red-dark),var(--red-deep))}
  .lp .news-main .card:nth-child(2) .media{background:linear-gradient(150deg,#d11a1a,var(--red-dark))}
  .lp .news-main .card:nth-child(3) .media{background:linear-gradient(150deg,var(--red-darker),var(--red))}
  .lp .media .placeholder{position:absolute;inset:0;font-size:64px}
  .lp .more-news{background:var(--gray-bg);border-radius:6px;padding:20px}
  .lp .more-news h3.panel-title{font-family:var(--font-heading),sans-serif;text-transform:uppercase;color:var(--red);font-size:18px;margin-bottom:16px;border-bottom:2px solid var(--red);padding-bottom:8px}
  .lp .mini{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--gray-line);transition:.2s}
  .lp .mini:last-child{border-bottom:none}
  .lp .mini:hover{padding-left:4px}
  .lp .mini .thumb-sm{width:74px;height:60px;border-radius:4px;flex-shrink:0;background:linear-gradient(150deg,var(--red),var(--red-darker))}
  .lp .mini .tag{display:inline-block;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:3px;margin-bottom:4px}
  .lp .mini h4{font-family:var(--font-heading),sans-serif;font-size:14px;font-weight:700;line-height:1.2}
  .lp .mini:hover h4{color:var(--red)}
  .lp .mini .date{font-size:11px;color:#999;margin-top:3px}
  .lp .squad{background:var(--gray-bg)}
  .lp .squad-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:26px}
  .lp .tabs{display:flex;gap:6px}
  .lp .tab{font-family:var(--font-heading),sans-serif;text-transform:uppercase;letter-spacing:.5px;font-weight:700;font-size:14px;padding:10px 22px;border:2px solid var(--red);background:#fff;color:var(--red);cursor:pointer;border-radius:4px;transition:.2s}
  .lp .tab.active{background:var(--red);color:#fff}
  .lp .squad-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:18px}
  .lp .player{background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);transition:.25s;cursor:pointer}
  .lp .player:hover{transform:translateY(-6px);box-shadow:0 14px 30px rgba(198,40,40,.18)}
  .lp .player .top{position:relative;min-height:150px;background:linear-gradient(160deg,var(--red),var(--red-darker));display:flex;align-items:flex-end;justify-content:center}
  .lp .player .top .placeholder{position:absolute;inset:0;align-items:center;font-size:60px}
  .lp .player .num{position:absolute;top:10px;right:12px;font-family:var(--font-heading),sans-serif;font-size:34px;font-weight:700;color:rgba(255,255,255,.55);z-index:2}
  .lp .player .info{padding:12px;text-align:center}
  .lp .player .info b{font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-size:15px;display:block}
  .lp .player .info span{font-size:12px;color:#888}
  .lp .results-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
  .lp .result-card{border:1px solid var(--gray-line);border-radius:6px;overflow:hidden;transition:.25s}
  .lp .result-card:hover{transform:translateY(-6px);box-shadow:0 14px 30px rgba(198,40,40,.15)}
  .lp .result-card .rc-head{background:var(--red);color:#fff;font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-size:12px;letter-spacing:.5px;text-align:center;padding:8px}
  .lp .rc-body{padding:20px;display:flex;align-items:center;justify-content:space-around;gap:10px}
  .lp .rc-team{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1}
  .lp .rc-team .mb-badge{width:50px;height:50px}
  .lp .rc-team b{font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-size:13px;text-align:center}
  .lp .rc-score{font-family:var(--font-heading),sans-serif;font-size:34px;font-weight:700;color:var(--red)}
  .lp .rc-foot{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-top:1px solid var(--gray-line);font-size:12px}
  .lp .status{font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-weight:700;letter-spacing:.5px}
  .lp .status.done{color:#888}
  .lp .status.next{color:var(--red)}
  .lp .membership{background:linear-gradient(120deg,var(--red),var(--red-darker));color:#fff;text-align:center}
  .lp .membership h2{font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-size:34px;font-weight:700;margin-bottom:12px}
  .lp .membership p{font-size:17px;opacity:.92;margin-bottom:26px;max-width:640px;margin-left:auto;margin-right:auto}
  .lp .cat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:22px}
  .lp .cat{text-align:center;padding:24px 10px;border-radius:8px;transition:.25s;cursor:pointer}
  .lp .cat:hover{background:var(--gray-bg);transform:translateY(-6px)}
  .lp .cat .circle{width:84px;height:84px;border-radius:50%;background:linear-gradient(150deg,var(--red),var(--red-darker));display:flex;align-items:center;justify-content:center;color:#fff;font-size:38px;margin:0 auto 14px}
  .lp .cat b{font-family:var(--font-heading),sans-serif;text-transform:uppercase;display:block;font-size:16px}
  .lp .cat span{font-size:12px;color:#888}
  .lp .sponsors{background:var(--gray-bg);text-align:center}
  .lp .sponsor-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:30px;margin-top:10px}
  .lp .sponsor{width:150px;height:64px;background:#fff;border:1px solid var(--gray-line);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--red);font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-weight:700;letter-spacing:.5px;font-size:14px;transition:.2s}
  .lp .sponsor:hover{border-color:var(--red);box-shadow:0 6px 16px rgba(198,40,40,.12)}
  .lp footer{background:var(--red-deep);color:#fff;padding-top:50px}
  .lp .foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;gap:30px}
  .lp .foot-brand .shield{width:64px;height:64px;margin-bottom:14px}
  .lp .foot-brand p{font-size:13px;opacity:.82;margin-bottom:16px;max-width:280px}
  .lp .foot-social{display:flex;gap:14px;font-size:18px}
  .lp .foot-social a{opacity:.85}
  .lp .foot-social a:hover{opacity:1;color:#ffd6d6}
  .lp footer h4{font-family:var(--font-heading),sans-serif;text-transform:uppercase;font-size:15px;letter-spacing:.5px;margin-bottom:14px;color:#fff}
  .lp footer .fcol a{display:block;font-size:13px;opacity:.82;padding:5px 0;transition:.2s}
  .lp footer .fcol a:hover{opacity:1;color:#ffd6d6;padding-left:4px}
  .lp .foot-bottom{border-top:1px solid rgba(255,255,255,.15);margin-top:40px;padding:18px 0}
  .lp .foot-bottom .container{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:12px;opacity:.8}
  .lp .foot-bottom .links{display:flex;gap:18px}
  .lp .foot-bottom a:hover{color:#ffd6d6}
  @media(max-width:900px){
    .lp nav.main{position:fixed;top:72px;left:0;right:0;background:#fff;flex-direction:column;max-height:0;overflow:hidden;box-shadow:0 10px 20px rgba(0,0,0,.15);transition:max-height .3s}
    .lp nav.main.open{max-height:80vh;overflow:auto}
    .lp nav.main>ul{flex-direction:column;align-items:stretch}
    .lp nav.main>ul>li>a{padding:16px 20px;border-bottom:1px solid var(--gray-line)}
    .lp nav.main>ul>li>a::after{display:none}
    .lp .mega{position:static;transform:none;opacity:1;visibility:visible;box-shadow:none;min-width:0;grid-template-columns:1fr;padding:0 20px 14px;border-top:none}
    .lp .mega.small{min-width:0}
    .lp .burger{display:block}
    .lp .news-grid{grid-template-columns:1fr}
    .lp .squad-grid{grid-template-columns:repeat(3,1fr)}
    .lp .results-grid{grid-template-columns:repeat(2,1fr)}
    .lp .cat-grid{grid-template-columns:repeat(3,1fr)}
    .lp .matchbar .container{grid-template-columns:1fr}
    .lp .mb-cell{border-right:none;border-bottom:1px solid rgba(255,255,255,.12)}
    .lp .foot-grid{grid-template-columns:1fr 1fr}
    .lp .hero h1{font-size:34px}
  }
  @media(max-width:600px){
    .lp .utility .quick{display:none}
    .lp .news-main{grid-template-columns:1fr}
    .lp .squad-grid{grid-template-columns:repeat(2,1fr)}
    .lp .results-grid{grid-template-columns:1fr}
    .lp .cat-grid{grid-template-columns:repeat(2,1fr)}
    .lp .thumb-strip{grid-template-columns:1fr}
    .lp .foot-grid{grid-template-columns:1fr}
    .lp .foot-bottom .container{flex-direction:column;text-align:center}
  }
  .lp .access{display:flex;align-items:center;gap:8px;flex-shrink:0}
  .lp .btn-access{font-family:var(--font-heading),sans-serif;text-transform:uppercase;letter-spacing:.5px;font-weight:700;font-size:12px;padding:8px 14px;border-radius:4px;border:2px solid var(--red);color:var(--red);display:flex;align-items:center;gap:6px;transition:.2s}
  .lp .btn-access:hover{background:var(--red);color:#fff}
  .lp .btn-access.primary{background:var(--red);color:#fff}
  .lp .btn-access.primary:hover{background:var(--red-darker);border-color:var(--red-darker)}
  @media(max-width:900px){.lp .access .btn-access{display:none}.lp .access .btn-access.primary{display:flex}}
`

export default function Landing() {
  const [navOpen, setNavOpen] = useState(false)
  const [squadTab, setSquadTab] = useState<"masc" | "fem">("masc")

  return (
    <div className={`${roboto.variable} ${robotoCondensed.variable} lp`}>
      <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.1.0/dist/tabler-icons.min.css" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ===== 1. UTILITY BAR ===== */}
      <div className="utility">
        <div className="container">
          <ul className="quick label">
            <li><a href="#"><span className="live-dot"></span> Transmissão Ao Vivo</a></li>
            <li><a href="#">Sócio Torcedor</a></li>
            <li><a href="#">Universo Itaquerense</a></li>
            <li><a href="#">Chute Inicial</a></li>
            <li><a href="#">Itaquerense TV</a></li>
            <li><a href="#">Arena Itaquerense</a></li>
            <li><a href="#">Calendário</a></li>
          </ul>
          <ul className="social">
            <li><a href="#" aria-label="LinkedIn"><i className="ti ti-brand-linkedin"></i></a></li>
            <li><a href="#" aria-label="Instagram"><i className="ti ti-brand-instagram"></i></a></li>
            <li><a href="#" aria-label="X"><i className="ti ti-brand-x"></i></a></li>
            <li><a href="#" aria-label="Facebook"><i className="ti ti-brand-facebook"></i></a></li>
            <li><a href="#" aria-label="YouTube"><i className="ti ti-brand-youtube"></i></a></li>
            <li><a href="#" aria-label="TikTok"><i className="ti ti-brand-tiktok"></i></a></li>
            <li><a href="#" aria-label="WhatsApp"><i className="ti ti-brand-whatsapp"></i></a></li>
          </ul>
        </div>
      </div>

      {/* ===== 2. STICKY HEADER ===== */}
      <header className="site">
        <div className="container header-row">
          <Link className="brand" href="/">
            <Image className="shield" src="/logo.png" alt="E.C. Itaquerense" width={50} height={50} />
            <span className="name"><b>E.C. Itaquerense</b><span>Site Oficial</span></span>
          </Link>

          <button className="burger" aria-label="Menu" aria-expanded={navOpen} aria-controls="nav" onClick={() => setNavOpen(o => !o)}><i className="ti ti-menu-2"></i></button>

          <nav className={"main" + (navOpen ? " open" : "")} id="nav">
            <ul>
              <li><a href="#">Clube</a>
                <div className="mega">
                  <div><h4>Institucional</h4><a href="#">História</a><a href="#">Estatuto</a><a href="#">Gestão</a><a href="#">Conselho</a></div>
                  <div><h4>Estrutura</h4><a href="#">Arena Itaquerense</a><a href="#">Centro de Treinamento</a><a href="#">Sede Social</a><a href="#">Memória</a></div>
                </div>
              </li>
              <li><a href="#">Futebol</a>
                <div className="mega">
                  <div><h4>Profissional</h4><a href="#">Elenco Masculino</a><a href="#">Elenco Feminino</a><a href="#">Comissão Técnica</a></div>
                  <div><h4>Base</h4><a href="/turmas">Turmas</a><a href="#">Sub-17</a><a href="#">Sub-15</a><a href="#">Categorias de Base</a></div>
                </div>
              </li>
              <li><a href="#">Modalidades</a>
                <div className="mega">
                  <div><h4>Esportes</h4><a href="#">Futebol</a><a href="#">Futsal</a></div>
                </div>
              </li>
              <li><a href="#">Matrícula/Planos</a>
                <div className="mega">
                  <div><h4>Matrícula</h4><a href="/matricula">Pré-Matrícula</a><a href="/turmas">Turmas &amp; Horários</a><a href="#">Como Funciona</a></div>
                  <div><h4>Sócio</h4><a href="#">Sócio Torcedor</a><a href="#">Planos</a><a href="#">Benefícios</a></div>
                </div>
              </li>
              <li><a href="#">Notícias</a>
                <div className="mega">
                  <div><h4>Categorias</h4><a href="#">Futebol</a><a href="#">Modalidades</a><a href="#">Clube</a></div>
                  <div><h4>Conteúdo</h4><a href="#">Vídeos</a><a href="#">Bastidores</a><a href="#">Entrevistas</a></div>
                </div>
              </li>
            </ul>
          </nav>

          <div className="access">
            <a href="/matricula" className="btn-access primary">Matrícula</a>
            <a href="/responsavel" className="btn-access">Portal do Responsável</a>
            <a href="/login" className="btn-access" aria-label="Área administrativa"><i className="ti ti-lock"></i> Entrar</a>
          </div>

        </div>
      </header>

      {/* ===== 3. HERO ===== */}
      <div className="hero">
        <div className="container">
          <span className="badge">Campeonato 2026</span>
          <h1>E.C. Itaquerense vence fora de casa pela 18ª rodada e segue na briga pelo topo</h1>
          <p>Com atuação sólida e gol na etapa final, o Itaquerense somou três pontos importantes na disputa pela liderança.</p>
          <a href="#" className="btn btn-white">Ler Matéria</a>
        </div>
      </div>
      <div className="thumb-strip">
        <a className="thumb" href="#"><div className="placeholder"><i className="ti ti-ball-football"></i></div><span className="tag">Copa Regional</span><h3>Fora de casa, o Itaquerense avança e está nas oitavas da Copa Regional</h3></a>
        <a className="thumb" href="#"><div className="placeholder"><i className="ti ti-trophy"></i></div><span className="tag">Estadual</span><h3>Itaquerense conhece seu adversário nas oitavas de final do Estadual 2026</h3></a>
        <a className="thumb" href="#"><div className="placeholder"><i className="ti ti-shield"></i></div><span className="tag">Base</span><h3>E.C. Itaquerense estreia vencendo no Campeonato Sub-17</h3></a>
      </div>

      {/* ===== 4. MATCH INFO BAR ===== */}
      <div className="matchbar">
        <div className="container">
          <div className="mb-cell">
            <span className="mb-comp">Último Jogo · 18ª Rodada</span>
            <div className="mb-match">
              <Image className="mb-badge" src="/logo.png" alt="E.C. Itaquerense" width={44} height={44} />
              <span className="mb-score">1 × 0</span>
              <Image className="mb-badge" src="/logo.png" alt="Adversário" width={44} height={44} style={{ filter: "grayscale(1) opacity(.6)" }} />
            </div>
            <span className="mb-info">Itaquerense 1 × 0 Vila Real — 01/06/2026</span>
          </div>
          <div className="mb-cell">
            <span className="mb-comp">Copa Regional · Oitavas</span>
            <div className="mb-match">
              <Image className="mb-badge" src="/logo.png" alt="E.C. Itaquerense" width={44} height={44} />
              <span className="mb-score">2 × 1</span>
              <Image className="mb-badge" src="/logo.png" alt="Adversário" width={44} height={44} style={{ filter: "grayscale(1) opacity(.6)" }} />
            </div>
            <span className="mb-info">Itaquerense 2 × 1 União EC — 31/05/2026</span>
          </div>
          <div className="mb-cell">
            <span className="mb-comp">Próximo Jogo · 19ª Rodada</span>
            <div className="mb-match">
              <Image className="mb-badge" src="/logo.png" alt="E.C. Itaquerense" width={44} height={44} />
              <span className="mb-score">VS</span>
              <Image className="mb-badge" src="/logo.png" alt="Adversário" width={44} height={44} style={{ filter: "grayscale(1) opacity(.6)" }} />
            </div>
            <span className="mb-info">Itaquerense vs Atlético Leste — 07/06/2026 16h</span>
            <a href="/matricula" className="btn btn-white" style={{ padding: "8px 20px", marginTop: "4px" }}>Matrícula</a>
          </div>
        </div>
      </div>

      {/* ===== 5. NEWS ===== */}
      <section>
        <div className="container">
          <h2 className="section-title">Notícias</h2>
          <div className="news-grid">
            <div className="news-main">
              <article className="card featured">
                <div className="media"><span className="tag">Campeonato</span><div className="placeholder"><i className="ti ti-ball-football"></i></div></div>
                <div className="body"><h3>E.C. Itaquerense vence fora de casa pela 18ª rodada e segue na briga pelo topo</h3><span className="date">01/06/2026 · 18h30</span></div>
              </article>
              <article className="card">
                <div className="media"><span className="tag">Copa Regional</span><div className="placeholder"><i className="ti ti-trophy"></i></div></div>
                <div className="body"><h3>Sorteio define o adversário do Itaquerense nas oitavas de final da Copa Regional 2026</h3><span className="date">30/05/2026</span></div>
              </article>
              <article className="card">
                <div className="media"><span className="tag">Clube</span><div className="placeholder"><i className="ti ti-building-store"></i></div></div>
                <div className="body"><h3>E.C. Itaquerense inaugura nova loja oficial e amplia sua rede em 2026</h3><span className="date">29/05/2026</span></div>
              </article>
            </div>

            <aside className="more-news">
              <h3 className="panel-title">Mais Notícias</h3>
              <a className="mini" href="#"><div className="thumb-sm"></div><div><span className="tag">Copa Regional</span><h4>Fora de casa, o Itaquerense avança e está nas oitavas de final</h4><div className="date">31/05/2026</div></div></a>
              <a className="mini" href="#"><div className="thumb-sm"></div><div><span className="tag">Estadual</span><h4>Itaquerense conhece seu adversário nas oitavas do Estadual 2026</h4><div className="date">28/05/2026</div></div></a>
              <a className="mini" href="#"><div className="thumb-sm"></div><div><span className="tag">Base</span><h4>E.C. Itaquerense estreia vencendo no Campeonato Sub-17</h4><div className="date">27/05/2026</div></div></a>
              <a className="mini" href="#"><div className="thumb-sm"></div><div><span className="tag">Clube</span><h4>E.C. Itaquerense inaugura nova loja oficial em 2026</h4><div className="date">26/05/2026</div></div></a>
            </aside>
          </div>
        </div>
      </section>

      {/* ===== 6. SQUAD ===== */}
      <section className="squad">
        <div className="container">
          <div className="squad-head">
            <h2 className="section-title" style={{ marginBottom: "0" }}>Elenco</h2>
            <div className="tabs">
              <button className={"tab" + (squadTab === "masc" ? " active" : "")} onClick={() => setSquadTab("masc")}>Masculino</button>
              <button className={"tab" + (squadTab === "fem" ? " active" : "")} onClick={() => setSquadTab("fem")}>Feminino</button>
            </div>
          </div>

          <div className="squad-grid" id="squad-masc" style={{ display: squadTab === "masc" ? "grid" : "none" }}>
            <div className="player"><div className="top"><span className="num">1</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Goleiro</b><span>Elenco Masculino</span></div></div>
            <div className="player"><div className="top"><span className="num">3</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Zagueiro</b><span>Elenco Masculino</span></div></div>
            <div className="player"><div className="top"><span className="num">4</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Zagueiro</b><span>Elenco Masculino</span></div></div>
            <div className="player"><div className="top"><span className="num">5</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Meio-campo</b><span>Elenco Masculino</span></div></div>
            <div className="player"><div className="top"><span className="num">8</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Meia</b><span>Elenco Masculino</span></div></div>
            <div className="player"><div className="top"><span className="num">10</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Atacante</b><span>Elenco Masculino</span></div></div>
          </div>

          <div className="squad-grid" id="squad-fem" style={{ display: squadTab === "fem" ? "grid" : "none" }}>
            <div className="player"><div className="top"><span className="num">1</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Goleira</b><span>Elenco Feminino</span></div></div>
            <div className="player"><div className="top"><span className="num">2</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Lateral</b><span>Elenco Feminino</span></div></div>
            <div className="player"><div className="top"><span className="num">4</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Zagueira</b><span>Elenco Feminino</span></div></div>
            <div className="player"><div className="top"><span className="num">8</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Meio-campo</b><span>Elenco Feminino</span></div></div>
            <div className="player"><div className="top"><span className="num">9</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Atacante</b><span>Elenco Feminino</span></div></div>
            <div className="player"><div className="top"><span className="num">11</span><div className="placeholder"><i className="ti ti-user"></i></div></div><div className="info"><b>Meia</b><span>Elenco Feminino</span></div></div>
          </div>
        </div>
      </section>

      {/* ===== 7. RESULTS & SCHEDULE ===== */}
      <section>
        <div className="container">
          <h2 className="section-title">Resultados &amp; Agenda</h2>
          <div className="results-grid">
            <div className="result-card">
              <div className="rc-head">Campeonato · 18ª Rodada</div>
              <div className="rc-body">
                <div className="rc-team"><Image className="mb-badge" src="/logo.png" alt="E.C. Itaquerense" width={44} height={44} /><b>Itaquerense</b></div>
                <span className="rc-score">1 × 0</span>
                <div className="rc-team"><Image className="mb-badge" src="/logo.png" alt="Adversário" width={44} height={44} style={{ filter: "grayscale(1) opacity(.6)" }} /><b>Vila Real</b></div>
              </div>
              <div className="rc-foot"><span className="status done">Encerrado</span><span>01/06/2026</span></div>
            </div>
            <div className="result-card">
              <div className="rc-head">Copa Regional · Oitavas</div>
              <div className="rc-body">
                <div className="rc-team"><Image className="mb-badge" src="/logo.png" alt="E.C. Itaquerense" width={44} height={44} /><b>Itaquerense</b></div>
                <span className="rc-score">2 × 1</span>
                <div className="rc-team"><Image className="mb-badge" src="/logo.png" alt="Adversário" width={44} height={44} style={{ filter: "grayscale(1) opacity(.6)" }} /><b>União EC</b></div>
              </div>
              <div className="rc-foot"><span className="status done">Encerrado</span><span>31/05/2026</span></div>
            </div>
            <div className="result-card">
              <div className="rc-head">Campeonato · 19ª Rodada</div>
              <div className="rc-body">
                <div className="rc-team"><Image className="mb-badge" src="/logo.png" alt="E.C. Itaquerense" width={44} height={44} /><b>Itaquerense</b></div>
                <span className="rc-score">VS</span>
                <div className="rc-team"><Image className="mb-badge" src="/logo.png" alt="Adversário" width={44} height={44} style={{ filter: "grayscale(1) opacity(.6)" }} /><b>Atlético Leste</b></div>
              </div>
              <div className="rc-foot"><span className="status next">Próximo Jogo</span><span>07/06/2026 16h</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 8. MEMBERSHIP BANNER ===== */}
      <section className="membership">
        <div className="container">
          <h2>Matricule-se na Escolinha</h2>
          <p>Garanta a vaga do seu filho, acompanhe tudo pelo portal do responsável e viva o dia a dia do E.C. Itaquerense. Faça parte da nossa história.</p>
          <a href="/matricula" className="btn btn-white">Fazer Matrícula</a>
        </div>
      </section>

      {/* ===== 9. CATEGORIES ===== */}
      <section>
        <div className="container">
          <h2 className="section-title">Modalidades</h2>
          <div className="cat-grid">
            <a className="cat" href="#"><div className="circle"><i className="ti ti-ball-football"></i></div><b>Futebol</b><span>Masculino &amp; Feminino</span></a>
            <a className="cat" href="#"><div className="circle"><i className="ti ti-ball-football"></i></div><b>Futsal</b><span>Liga Local</span></a>
          </div>
        </div>
      </section>

      {/* ===== 10. SPONSORS ===== */}
      <section className="sponsors">
        <div className="container">
          <h2 className="section-title" style={{ display: "inline-block", border: "none", padding: "0", color: "#888" }}>Patrocinadores</h2>
          <div className="sponsor-row">
            <div className="sponsor">Patrocínio</div>
            <div className="sponsor">Master</div>
            <div className="sponsor">Fornecedor</div>
            <div className="sponsor">Apoio</div>
            <div className="sponsor">Parceiro</div>
          </div>
        </div>
      </section>

      {/* ===== 11. FOOTER ===== */}
      <footer>
        <div className="container foot-grid">
          <div className="foot-brand">
            <Image className="shield" src="/logo.png" alt="E.C. Itaquerense" width={64} height={64} />
            <p>E.C. Itaquerense — site oficial. Tradição, paixão e formação esportiva em cada modalidade. Vamos juntos por mais conquistas.</p>
            <div className="foot-social">
              <a href="#" aria-label="Instagram"><i className="ti ti-brand-instagram"></i></a>
              <a href="#" aria-label="X"><i className="ti ti-brand-x"></i></a>
              <a href="#" aria-label="Facebook"><i className="ti ti-brand-facebook"></i></a>
              <a href="#" aria-label="YouTube"><i className="ti ti-brand-youtube"></i></a>
              <a href="#" aria-label="TikTok"><i className="ti ti-brand-tiktok"></i></a>
            </div>
          </div>
          <div className="fcol"><h4>Clube</h4><a href="#">História</a><a href="#">Estatuto</a><a href="#">Gestão</a><a href="#">Arena</a><a href="#">Memória</a></div>
          <div className="fcol"><h4>Futebol</h4><a href="#">Elenco Masculino</a><a href="#">Elenco Feminino</a><a href="/turmas">Turmas</a><a href="#">Comissão</a></div>
          <div className="fcol"><h4>Modalidades</h4><a href="#">Futebol</a><a href="#">Futsal</a></div>
          <div className="fcol"><h4>Serviços</h4><a href="/matricula">Pré-Matrícula</a><a href="/responsavel">Portal do Responsável</a><a href="#">Loja Oficial</a></div>
        </div>
        <div className="foot-bottom">
          <div className="container">
            <span>© 2026 E.C. Itaquerense. Todos os direitos reservados.</span>
            <div className="links">
              <a href="#">Política de Privacidade</a>
              <a href="#">Termos de Uso</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
