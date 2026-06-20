/** Tokens canônicos do site público — defina aqui, use em todos os page.tsx */
export const PUB_TOKENS = `
  --red:#C62828;--red-dark:#9F1D1D;--red-deep:#4A0B0B;--red-warm:#D84040;--red-darker:#7F0000;
  --white:#fff;--bg:#FAF8F5;--bg-card:#fff;--bg-muted:#F3EFE9;
  --text:#1A1A2E;--text-muted:#6B6B7B;--text-light:#9696A0;
  --border:#E8E2DA;
  --shadow-sm:0 2px 8px rgba(26,26,46,.07);
  --shadow-md:0 8px 28px rgba(26,26,46,.12);
  --shadow-hover:0 16px 48px rgba(26,26,46,.18);
  --shadow-red:0 8px 28px rgba(198,40,40,.22);
  --radius-md:12px;--radius-lg:18px;--radius-xl:24px;
  --ease:cubic-bezier(.25,.46,.45,.94);
  font-family:var(--font-body),Arial,sans-serif;
  color:var(--text);background:var(--bg);
  -webkit-font-smoothing:antialiased;min-height:100vh;overflow-x:clip
`

/** CSS base para um namespace público: tokens + reset + link reset */
export function pubBase(ns: string): string {
  return `.${ns}{${PUB_TOKENS}}\n.${ns} *{margin:0;padding:0;box-sizing:border-box}\n.${ns} a{text-decoration:none;color:inherit}`
}

/** Header dark-red padrão — todas as páginas públicas */
export const PUB_HDR_CSS = `
  .pub-hdr{background:linear-gradient(135deg,#4A0B0B 0%,#C62828 60%,#9F1D1D 100%);color:#fff;position:sticky;top:0;z-index:100;box-shadow:0 2px 16px rgba(0,0,0,.28)}
  .pub-hdr .inner{max-width:1060px;margin:0 auto;padding:0 24px;display:flex;align-items:center;height:68px;gap:14px}
  .pub-hdr .brand{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
  .pub-hdr .brand-name{font-family:var(--font-heading),Georgia,serif;font-size:17px;font-weight:800;letter-spacing:-.3px;white-space:nowrap}
  .pub-hdr .brand-sub{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1.5px;font-weight:500}
  .pub-hdr .back{font-size:12px;font-weight:600;color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:6px 14px;white-space:nowrap;flex-shrink:0;transition:background .2s}
  .pub-hdr .back:hover{background:rgba(255,255,255,.15)}
`

/** Footer padrão (copyright + links) — horários, notícias, etc. */
export const PUB_FOOT_CSS = `
  .pub-foot{border-top:1px solid var(--border);padding:24px 0}
  .pub-foot .inner{max-width:1060px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--text-light);flex-wrap:wrap;gap:10px}
  .pub-foot a{color:var(--text-muted);font-weight:600;transition:color .2s}
  .pub-foot a:hover{color:var(--red)}
`
