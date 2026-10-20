"use client"

const THEME_PRELOAD =
  "try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark'}}catch(e){}"

/**
 * Anti-flash do tema escuro. No SSR sai como <script> executável no <head> e
 * roda antes do primeiro paint. No cliente o React nunca executa scripts e, se
 * precisar recriar o <head> (ex.: erro de hidratação que força render no
 * cliente), avisa "Encountered a script tag while rendering React component".
 * Por isso no cliente o tipo vira "text/plain" (bloco de dados, sem aviso); a
 * diferença de atributo na hidratação fica coberta por suppressHydrationWarning.
 */
export function ThemeScript() {
  return (
    <script
      id="theme-preload"
      type={typeof window === "undefined" ? undefined : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_PRELOAD }}
    />
  )
}
