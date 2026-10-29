/**
 * Fonte canônica já carregada no root layout (`app/layout.tsx`):
 *   --font-raleway  (Raleway, variável 100–900 — corpo, UI e títulos)
 *   --font-body / --font-heading (mapeados em globals.css)
 *
 * NÃO chamar next/font de novo aqui — instanciar duas vezes quebra o HMR
 * do Turbopack ("No link element found for chunk …css").
 */

/** Classe no-op para wrappers de página pública (variáveis vêm do <html>). */
export const publicFontClass = ""
