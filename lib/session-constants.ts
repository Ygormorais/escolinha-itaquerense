// Compartilhado entre lib/session.ts (Node) e proxy.ts (edge) — manter este
// arquivo livre de imports que não rodem no edge runtime.
export const SESSION_COOKIE = "escolinha_session"

// "auth2:" = cookie com segmento de role; o prefixo invalida cookies do
// formato antigo ("auth:username") que permitiam elevação silenciosa a admin.
export const SESSION_PREFIX = "auth2:"
