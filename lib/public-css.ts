/**
 * Design tokens canônicos — site público, login e páginas isoladas.
 * Orgânico/Humano: papel quente, texto quente, accent vermelho alvirrubro.
 *
 * Use em todo page.tsx público via `pubBase("ns")` + `publicFontClass`.
 */
export const PUB_TOKENS = `
  --red:#C62828;
  --red-dark:#9F1D1D;
  --red-deep:#4A0B0B;
  --red-warm:#D84040;
  --red-darker:#7F0000;
  --red-soft:#E53935;
  --white:#fff;
  --bg:#FAF8F5;
  --bg-card:#fff;
  --bg-muted:#F3EFE9;
  --bg-elevated:#FFFCF9;
  --text:#1C1412;
  --text-muted:#5C534E;
  --text-light:#8A827C;
  --border:#E8E2DA;
  --border-strong:#D4CBC0;
  --shadow-sm:0 2px 8px rgba(74,11,11,.06);
  --shadow-md:0 8px 28px rgba(74,11,11,.10);
  --shadow-hover:0 14px 40px rgba(198,40,40,.16);
  --shadow-red:0 8px 28px rgba(198,40,40,.22);
  --radius-sm:10px;
  --radius-md:14px;
  --radius-lg:20px;
  --radius-xl:24px;
  --radius-pill:999px;
  --ease:cubic-bezier(.25,.46,.45,.94);
  font-family:var(--font-body),var(--font-inter),Inter,system-ui,sans-serif;
  color:var(--text);
  background:var(--bg);
  line-height:1.65;
  -webkit-font-smoothing:antialiased;
  min-height:100vh;
  overflow-x:clip
`

/** Tokens escuros — mantém brand vermelho; superfícies em carvão quente. */
export const PUB_TOKENS_DARK = `
  --bg:#14110F;
  --bg-card:#1F1A18;
  --bg-muted:#1A1614;
  --bg-elevated:#24201D;
  --text:#F5F0EB;
  --text-muted:#B8AFA8;
  --text-light:#8A827C;
  --border:#3A332E;
  --border-strong:#4A423C;
  --shadow-sm:0 2px 8px rgba(0,0,0,.28);
  --shadow-md:0 8px 28px rgba(0,0,0,.36);
  --shadow-hover:0 14px 40px rgba(198,40,40,.28);
  --shadow-red:0 8px 28px rgba(198,40,40,.32)
`

/** CSS base para um namespace público: tokens + reset + link reset */
export function pubBase(ns: string): string {
  return [
    `.${ns}{${PUB_TOKENS}}`,
    `html.dark .${ns}{${PUB_TOKENS_DARK}}`,
    `.${ns} *{margin:0;padding:0;box-sizing:border-box}`,
    `.${ns} a{text-decoration:none;color:inherit}`,
    `.${ns} h1,.${ns} h2,.${ns} h3,.${ns} h4{font-family:var(--font-heading),var(--font-playfair),Georgia,serif}`,
  ].join("\n")
}

/**
 * Header sticky claro — mesma linguagem da landing (papel + borda quente).
 * Brand em vermelho; botão voltar outline.
 */
export const PUB_HDR_CSS = `
  .pub-hdr{
    background:rgba(255,252,249,.96);backdrop-filter:blur(10px);
    color:var(--text);position:sticky;top:0;z-index:100;
    box-shadow:0 1px 0 var(--border), var(--shadow-sm);overflow:hidden
  }
  html.dark .pub-hdr{background:rgba(31,26,24,.96)}
  .pub-hdr .inner{
    width:min(calc(100% - 48px),1200px);margin:0 auto;
    display:flex;align-items:center;height:68px;gap:14px
  }
  .pub-hdr .brand{display:flex;align-items:center;gap:12px;flex:1 1 auto;min-width:0;overflow:hidden}
  .pub-hdr .brand img{width:40px;height:40px;object-fit:contain;flex:0 0 40px;border-radius:8px}
  .pub-hdr .brand-name{
    font-family:var(--font-heading),Georgia,serif;font-size:17px;font-weight:800;
    letter-spacing:-.3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--red)
  }
  .pub-hdr .brand-sub{
    font-size:10px;color:var(--text-light);text-transform:uppercase;
    letter-spacing:1.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis
  }
  .pub-hdr .pub-hdr-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}
  .pub-hdr .pub-theme{
    width:36px;height:36px;border-radius:50%;border:1px solid var(--border);
    color:var(--text-light);background:transparent;padding:0
  }
  .pub-hdr .pub-theme:hover{
    color:var(--text);border-color:var(--text-muted);background:var(--bg-muted)
  }
  .pub-hdr .pub-theme:focus-visible{outline:3px solid var(--red);outline-offset:2px}
  .pub-hdr .back{
    font-size:12px;font-weight:600;color:var(--red);
    border:1.5px solid var(--red);border-radius:999px;padding:7px 14px;
    white-space:nowrap;flex:0 0 auto;transition:background .2s,color .2s,transform .2s
  }
  .pub-hdr .back:hover{background:var(--red);color:#fff;transform:translateY(-1px)}
  @media(max-width:520px){
    .pub-hdr .inner{width:min(calc(100% - 24px),1200px);height:62px;gap:10px;
      padding-left:max(0px,env(safe-area-inset-left));padding-right:max(0px,env(safe-area-inset-right))}
    .pub-hdr .brand{gap:10px}
    .pub-hdr .brand img{width:34px;height:34px;flex-basis:34px}
    .pub-hdr .brand-name{font-size:15px}
    .pub-hdr .brand-sub{font-size:9px;letter-spacing:1px}
    .pub-hdr .pub-theme{width:34px;height:34px}
    .pub-hdr .back{padding:6px 10px;font-size:11px;min-height:36px}
  }
  @media(max-width:380px){
    .pub-hdr .back{max-width:42px;overflow:hidden;text-indent:-999px;position:relative}
    .pub-hdr .back::after{content:'←';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-indent:0;color:inherit}
  }
`

/** Footer padrão (copyright + links) — horários, notícias, etc. */
export const PUB_FOOT_CSS = `
  .pub-foot{border-top:1px solid var(--border);padding:24px 0;background:var(--bg)}
  .pub-foot .inner{max-width:1200px;margin:0 auto;padding:0 clamp(16px,4vw,28px);display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--text-light);flex-wrap:wrap;gap:10px;font-family:var(--font-body),Inter,sans-serif}
  .pub-foot a{color:var(--text-muted);font-weight:600;transition:color .2s}
  .pub-foot a:hover{color:var(--red)}
`
