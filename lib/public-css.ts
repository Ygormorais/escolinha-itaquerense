/**
 * Design tokens canônicos — site público, login e páginas isoladas.
 * Orgânico/Humano: papel quente, texto quente, accent vermelho alvirrubro.
 *
 * Use em todo page.tsx público via `pubBase("ns")` + `publicFontClass`.
 */
export const PUB_TOKENS = `
  --red:var(--brand-600);
  --red-dark:var(--brand-800);
  --red-deep:var(--brand-950);
  --red-warm:color-mix(in oklab, var(--brand-600) 50%, var(--brand-500));
  --red-darker:var(--brand-900);
  --red-soft:var(--brand-500);
  --white:#fff;
  --bg:var(--paper-50);
  --bg-card:#fff;
  --bg-muted:var(--paper-100);
  --bg-elevated:var(--paper-raised);
  --text:var(--ink-950);
  --text-muted:var(--ink-700);
  --text-light:var(--ink-500);
  --border:var(--ink-200);
  --border-strong:var(--ink-300);
  --shadow-sm:0 2px 8px color-mix(in srgb, var(--brand-950) 6%, transparent);
  --shadow-md:0 8px 28px color-mix(in srgb, var(--brand-950) 10%, transparent);
  --shadow-lg:0 24px 60px color-mix(in srgb, var(--brand-950) 12%, transparent);
  --shadow-hover:0 14px 40px color-mix(in srgb, var(--brand-600) 16%, transparent);
  --shadow-focus:0 0 0 4px color-mix(in srgb, var(--brand-600) 15%, transparent);
  --shadow-red:0 8px 28px color-mix(in srgb, var(--brand-600) 22%, transparent);
  --radius-sm:10px;
  --radius-md:16px;
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
  /* Filho de um flex em coluna com altura fixa: sem isto encolhe até 100vh e o
     cabeçalho sticky perde o trilho no meio da página. */
  flex-shrink:0;
  overflow-x:clip
`

/** Tokens escuros — mantém brand vermelho; superfícies em carvão quente. */
export const PUB_TOKENS_DARK = `
  --bg:#171312;
  --bg-card:#211A18;
  --bg-muted:#2B2321;
  --bg-elevated:#3A1717;
  --text:#F8F2F0;
  --text-muted:#B7A7A1;
  --text-light:var(--ink-500);
  --border:rgba(255,255,255,.1);
  --border-strong:rgba(255,255,255,.16);
  --shadow-sm:0 2px 8px rgba(0,0,0,.28);
  --shadow-md:0 8px 28px rgba(0,0,0,.36);
  --shadow-lg:0 24px 60px rgba(0,0,0,.42);
  --shadow-hover:0 14px 40px color-mix(in srgb, var(--brand-600) 28%, transparent);
  --shadow-red:0 8px 28px color-mix(in srgb, var(--brand-600) 32%, transparent)
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
