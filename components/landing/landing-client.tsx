"use client"
import { useState } from "react"
import Image from "next/image"
import { Inter, Playfair_Display } from "next/font/google"
import Link from "next/link"
import { JogosCarrossel } from "./jogos-carrossel"
import type { CategoriaJogos } from "@/lib/landing/jogos"

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
  .lp{font-family:var(--font-body),Arial,sans-serif;color:var(--text);background:var(--bg);line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased}
  .lp a{text-decoration:none;color:inherit}
  .lp ul{list-style:none}
  .lp img{max-width:100%;display:block}
  .lp .container{max-width:1240px;margin:0 auto;padding:0 24px}
  .lp .label{font-family:var(--font-body),sans-serif;text-transform:uppercase;letter-spacing:.6px;font-size:12px;font-weight:600}
  .lp .section-title{font-family:var(--font-heading),Georgia,serif;font-size:26px;font-weight:700;color:var(--text);border-left:4px solid var(--red);padding-left:14px;margin-bottom:32px;line-height:1.2}
  .lp .btn{display:inline-block;font-family:var(--font-body),sans-serif;text-transform:uppercase;letter-spacing:.8px;font-weight:700;font-size:13px;padding:14px 32px;border-radius:var(--radius-sm);cursor:pointer;border:2px solid transparent;transition:var(--transition)}
  .lp .btn-white{background:var(--white);color:var(--red)}
  .lp .btn-white:hover{background:transparent;color:var(--white);border-color:var(--white)}
  .lp .btn-red{background:var(--red);color:var(--white)}
  .lp .btn-red:hover{background:var(--red-warm);transform:translateY(-1px);box-shadow:0 6px 20px rgba(198,40,40,.35)}
  .lp .placeholder{display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.45);font-size:44px}
  .lp .shield{width:46px;height:46px;object-fit:contain;flex-shrink:0}
  .lp .mb-badge{width:44px;height:44px;object-fit:contain;background:#fff;border-radius:var(--radius-sm);padding:3px}
  .lp .utility{background:var(--red-deep);color:#fff;font-size:12px}
  .lp .utility .container{display:flex;justify-content:space-between;align-items:center;height:40px;gap:16px}
  .lp .utility ul{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
  .lp .utility .quick a{display:flex;align-items:center;gap:6px;opacity:.85;transition:var(--transition)}
  .lp .utility .quick a:hover{opacity:1;color:#FFCDD2}
  .lp .live-dot{width:8px;height:8px;border-radius:50%;background:#FF5252;display:inline-block;animation:blink 1.2s ease-in-out infinite;box-shadow:0 0 6px rgba(255,82,82,.7)}
  @keyframes blink{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.8)}}
  @keyframes wa-pulse{0%,100%{box-shadow:0 4px 16px rgba(37,211,102,.4)}50%{box-shadow:0 4px 24px rgba(37,211,102,.7),0 0 0 8px rgba(37,211,102,.12)}}
  .lp .utility .social{gap:14px;font-size:15px}
  .lp .utility .social a:hover{color:#FFCDD2}
  .lp header.site{position:sticky;top:0;z-index:1000;background:rgba(255,255,255,.97);backdrop-filter:blur(8px);box-shadow:0 1px 0 var(--border), var(--shadow-sm)}
  .lp .header-row{display:flex;align-items:center;height:76px;gap:14px;overflow:hidden}
  .lp .header-row nav.main{flex:1;min-width:0;overflow:hidden}
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
  .lp .mega{position:absolute;top:100%;left:50%;transform:translateX(-50%) translateY(12px);background:var(--white);min-width:520px;box-shadow:0 20px 48px rgba(26,26,46,.16);border-top:3px solid var(--red);padding:28px;opacity:0;visibility:hidden;transition:var(--transition);display:grid;grid-template-columns:repeat(2,1fr);gap:12px 36px;border-radius:0 0 var(--radius-md) var(--radius-md)}
  .lp nav.main>ul>li:hover .mega{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}
  .lp .mega.small{min-width:300px;grid-template-columns:1fr}
  .lp .mega h4{font-family:var(--font-body),sans-serif;text-transform:uppercase;font-size:11px;color:var(--red);letter-spacing:1px;font-weight:700;margin-bottom:10px;border-bottom:1px solid var(--border);padding-bottom:8px}
  .lp .mega a{display:block;padding:7px 0;font-size:14px;color:var(--text-muted);transition:var(--transition)}
  .lp .mega a:hover{color:var(--red);padding-left:8px}
  .lp .burger{display:none;font-size:26px;color:var(--red);background:none;border:none;cursor:pointer}
  .lp .hero{background:radial-gradient(ellipse at 80% 10%, rgba(255,255,255,.07) 0%, transparent 60%),linear-gradient(135deg, var(--red-deep) 0%, var(--red) 50%, var(--red-dark) 100%);color:#fff;position:relative;overflow:hidden}
  .lp .hero::before{content:'';position:absolute;right:-80px;top:-80px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle, rgba(255,255,255,.08) 0%, transparent 70%)}
  .lp .hero::after{content:'';position:absolute;left:-60px;bottom:-60px;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle, rgba(255,255,255,.05) 0%, transparent 70%)}
  .lp .hero .container{position:relative;z-index:2;padding:84px 24px 96px;max-width:860px}
  .lp .badge{display:inline-block;background:rgba(255,255,255,.15);color:#fff;font-family:var(--font-body),sans-serif;text-transform:uppercase;font-weight:700;font-size:11px;letter-spacing:1.5px;padding:6px 14px;border-radius:100px;margin-bottom:22px;border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(4px)}
  .lp .hero h1{font-family:var(--font-heading),Georgia,serif;font-size:52px;font-weight:800;line-height:1.08;margin-bottom:20px;letter-spacing:-.5px}
  .lp .hero p{font-size:18px;opacity:.88;margin-bottom:32px;max-width:640px;line-height:1.65;font-weight:400}
  .lp .thumb-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;background:var(--red-deep)}
  .lp .thumb{position:relative;min-height:160px;display:flex;align-items:flex-end;padding:20px;color:#fff;overflow:hidden;transition:var(--transition)}
  .lp .thumb .placeholder{position:absolute;inset:0;font-size:52px;transition:var(--transition)}
  .lp .thumb .tag{position:absolute;top:14px;left:14px;background:var(--red);font-size:10px;font-weight:700;letter-spacing:.8px;padding:4px 10px;border-radius:100px;z-index:2;text-transform:uppercase}
  .lp .thumb h3{position:relative;z-index:2;font-family:var(--font-body),sans-serif;font-size:15px;font-weight:600;line-height:1.3;text-shadow:0 2px 8px rgba(0,0,0,.6)}
  .lp .thumb:nth-child(1){background:linear-gradient(160deg,var(--red),var(--red-darker))}
  .lp .thumb:nth-child(2){background:linear-gradient(160deg,var(--red-dark),var(--red-deep))}
  .lp .thumb:nth-child(3){background:linear-gradient(160deg,#d11a1a,var(--red-dark))}
  .lp .thumb:hover{opacity:.92}
  .lp .thumb:hover .placeholder{transform:scale(1.1)}
  .lp section{padding:72px 0}
  .lp .news-grid{display:grid;grid-template-columns:2fr 1fr;gap:32px}
  .lp .news-main{display:grid;grid-template-columns:1fr 1fr;gap:24px}
  .lp .card{background:var(--bg-card);border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-md);transition:var(--transition);cursor:pointer;border:1px solid var(--border)}
  .lp .card:hover{transform:translateY(-6px);box-shadow:var(--shadow-hover);border-color:transparent}
  .lp .card .media{min-height:210px;position:relative}
  .lp .card .tag{position:absolute;top:14px;left:14px;background:var(--red);color:#fff;font-size:10px;font-weight:700;letter-spacing:.8px;padding:4px 10px;border-radius:100px;text-transform:uppercase}
  .lp .card .body{padding:20px 22px 22px}
  .lp .card .body h3{font-family:var(--font-heading),Georgia,serif;font-size:18px;font-weight:700;line-height:1.3;margin-bottom:10px;color:var(--text)}
  .lp .card:hover .body h3{color:var(--red)}
  .lp .card .date{font-size:12px;color:var(--text-light);font-weight:500}
  .lp .featured{grid-column:1 / -1}
  .lp .featured .media{min-height:340px}
  .lp .featured .body h3{font-size:24px}
  .lp .news-main .media{background:linear-gradient(150deg,var(--red),var(--red-darker))}
  .lp .featured .media{background:linear-gradient(135deg,var(--red-dark),var(--red-deep))}
  .lp .news-main .card:nth-child(2) .media{background:linear-gradient(150deg,#d11a1a,var(--red-dark))}
  .lp .news-main .card:nth-child(3) .media{background:linear-gradient(150deg,var(--red-darker),var(--red))}
  .lp .media .placeholder{position:absolute;inset:0;font-size:64px}
  .lp .more-news{background:var(--bg-muted);border-radius:var(--radius-md);padding:24px;border:1px solid var(--border)}
  .lp .more-news h3.panel-title{font-family:var(--font-heading),Georgia,serif;color:var(--text);font-size:18px;font-weight:700;margin-bottom:20px;border-bottom:2px solid var(--red);padding-bottom:10px}
  .lp .mini{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);transition:var(--transition)}
  .lp .mini:last-child{border-bottom:none}
  .lp .mini:hover{padding-left:6px}
  .lp .mini .thumb-sm{width:76px;height:62px;border-radius:var(--radius-sm);flex-shrink:0;background:linear-gradient(150deg,var(--red),var(--red-darker))}
  .lp .mini .tag{display:inline-block;background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;margin-bottom:5px;text-transform:uppercase;letter-spacing:.5px}
  .lp .mini h4{font-family:var(--font-body),sans-serif;font-size:13px;font-weight:600;line-height:1.3;color:var(--text)}
  .lp .mini:hover h4{color:var(--red)}
  .lp .mini .date{font-size:11px;color:var(--text-light);margin-top:4px}
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
  .lp .sponsors{background:var(--bg-muted);text-align:center}
  .lp .sponsor-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:24px;margin-top:14px}
  .lp .sponsor{width:152px;height:68px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-family:var(--font-body),sans-serif;text-transform:uppercase;font-weight:700;letter-spacing:.6px;font-size:13px;transition:var(--transition);box-shadow:var(--shadow-sm)}
  .lp .sponsor:hover{border-color:var(--red);color:var(--red);box-shadow:0 6px 20px rgba(198,40,40,.14);transform:translateY(-2px)}
  .lp footer{background:var(--red-deep);color:#fff;padding-top:60px}
  .lp .foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;gap:36px}
  .lp .foot-brand .shield{width:68px;height:68px;margin-bottom:16px}
  .lp .foot-brand p{font-size:13px;opacity:.78;margin-bottom:18px;max-width:280px;line-height:1.65}
  .lp .foot-social{display:flex;gap:14px;font-size:18px}
  .lp .foot-social a{opacity:.75;transition:var(--transition);width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08)}
  .lp .foot-social a:hover{opacity:1;background:rgba(255,255,255,.18);color:#FFCDD2}
  .lp footer h4{font-family:var(--font-body),sans-serif;text-transform:uppercase;font-size:11px;letter-spacing:1.5px;font-weight:700;margin-bottom:16px;color:rgba(255,255,255,.6)}
  .lp footer .fcol a{display:block;font-size:13px;opacity:.75;padding:6px 0;transition:var(--transition)}
  .lp footer .fcol a:hover{opacity:1;color:#FFCDD2;padding-left:6px}
  .lp .foot-bottom{border-top:1px solid rgba(255,255,255,.12);margin-top:48px;padding:20px 0}
  .lp .foot-bottom .container{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;font-size:12px;opacity:.7}
  .lp .foot-bottom .links{display:flex;gap:20px}
  .lp .foot-bottom a:hover{color:#FFCDD2;opacity:1}
  @media(max-width:900px){
    .lp nav.main{position:fixed;top:76px;left:0;right:0;background:#fff;flex-direction:column;max-height:0;overflow:hidden;box-shadow:0 10px 24px rgba(26,26,46,.18);transition:max-height .35s ease}
    .lp nav.main.open{max-height:80vh;overflow:auto}
    .lp nav.main>ul{flex-direction:column;align-items:stretch}
    .lp nav.main>ul>li>a{padding:16px 20px;border-bottom:1px solid var(--border)}
    .lp nav.main>ul>li>a::after{display:none}
    .lp .mega{position:static;transform:none;opacity:1;visibility:visible;box-shadow:none;min-width:0;grid-template-columns:1fr;padding:0 20px 16px;border-top:none}
    .lp .mega.small{min-width:0}
    .lp .burger{display:block}
    .lp .news-grid{grid-template-columns:1fr}
    .lp .cat-grid{grid-template-columns:repeat(3,1fr)}
    .lp .foot-grid{grid-template-columns:1fr 1fr}
    .lp .hero h1{font-size:38px}
    .lp section{padding:56px 0}
  }
  @media(max-width:600px){
    .lp .utility .quick{display:none}
    .lp .news-main{grid-template-columns:1fr}
    .lp .cat-grid{grid-template-columns:repeat(2,1fr)}
    .lp .thumb-strip{grid-template-columns:1fr}
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
`

export function LandingClient({ categorias, whatsapp }: { categorias: CategoriaJogos[]; whatsapp?: string }) {
  const [navOpen, setNavOpen] = useState(false)
  const waNumber = whatsapp?.replace(/\D/g, "") || "5511999999999"
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Olá! Gostaria de mais informações sobre a Escolinha Itaquerense.")}`

  return (
    <div className={`${inter.variable} ${playfair.variable} lp`}>
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
            <Image className="shield" src="/logo.png" alt="E.C. Itaquerense" width={52} height={52} />
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
              <li><a href="#">Modalidades</a>
                <div className="mega">
                  <div><h4>Esportes</h4><a href="#">Futebol</a><a href="#">Futsal</a></div>
                </div>
              </li>
              <li><a href="#">Matrícula/Turmas</a>
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

      <JogosCarrossel categorias={categorias} />

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
            <a className="cat" href="#"><div className="circle"><i className="ti ti-ball-football"></i></div><b>Futsal Federado</b><span>Liga Local</span></a>
            <a className="cat" href="#"><div className="circle"><i className="ti ti-school"></i></div><b>Escolinha</b><span>Formação de Base</span></a>
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
            <Image className="shield" src="/logo.png" alt="E.C. Itaquerense" width={68} height={68} />
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
          <div className="fcol"><h4>Futebol</h4><a href="/turmas">Turmas</a><a href="#">Categorias de Base</a><a href="#">Comissão</a><a href="/resultados">Resultados &amp; Classificação</a></div>
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
