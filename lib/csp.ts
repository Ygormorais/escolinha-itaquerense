/**
 * Content-Security-Policy do sistema. Hoje vai em modo Report-Only: o navegador
 * NÃO bloqueia nada, só relata violações em /api/csp-report (aparecem nos logs).
 * Depois de um período sem violações legítimas, troque o cabeçalho para
 * "Content-Security-Policy" (e, aí sim, considere nonces no lugar de 'unsafe-inline').
 *
 * Mantém sem importações: é lida por next.config.ts.
 */

export const CSP_REPORT_PATH = "/api/csp-report"

/** Origens de imagem externas já autorizadas em next.config.ts (images.remotePatterns). */
const IMG_EXTERNAS = [
  "https://img.youtube.com",
  "https://upload.wikimedia.org",
  "https://logodetimes.com",
  "https://admfutsal.com.br",
  "http://admfutsal.com.br",
]

export function buildContentSecurityPolicy({ dev = false }: { dev?: boolean } = {}): string {
  const diretivas: Record<string, string[]> = {
    "default-src": ["'self'"],
    // Next injeta scripts inline (hidratação) e o JSON-LD é inline; 'unsafe-eval' só no dev (HMR).
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    // Estilos inline: a landing e as páginas públicas usam <style> embutido.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", ...IMG_EXTERNAS],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", ...(dev ? ["ws:", "wss:"] : [])],
    // Vídeos do YouTube no portal da família.
    "frame-src": ["https://www.youtube.com", "https://www.youtube-nocookie.com"],
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  }
  return [
    ...Object.entries(diretivas).map(([nome, valores]) => `${nome} ${valores.join(" ")}`),
    `report-uri ${CSP_REPORT_PATH}`,
  ].join("; ")
}
