import { describe, it, expect } from "vitest"
import { isPublicPath } from "../proxy"

describe("isPublicPath — rotas exatas públicas", () => {
  it.each(["/", "/login", "/api/health", "/logo.png", "/sw.js", "/manifest.json"])(
    "%s é público",
    (path) => expect(isPublicPath(path)).toBe(true)
  )
})

describe("isPublicPath — prefixos de API públicos", () => {
  it.each([
    "/api/auth/login",
    "/api/auth/logout",
    "/api/responsavel/auth",
    "/api/responsavel/recuperar-senha",
    "/api/push/subscribe",
    "/api/push/preferencias",
    "/api/whatsapp/webhook",
    "/api/webhooks/mercadopago",
    "/api/cron/lembretes",
    "/api/sync/fpfs",
    "/api/config/public",
    "/api/escudo",
    "/api/escudo?u=https%3A%2F%2Fadmfutsal.com.br%2Fassets%2Fimages%2Ffoto%2Fescudo%2F1.png",
    "/api/upload/matricula",
    "/uploads/fotos/1.jpg",
    "/matricula",
    "/matricula/nova",
    "/resultados",
    "/resultados/2025",
    "/horarios",
    "/horarios/sub-13",
    "/noticias/publico",
    "/noticias/publico/123",
    "/responsavel/login",
    "/responsavel/recuperar-senha",
    "/responsavel/redefinir-senha",
    "/_next/static/chunks/app.js",
    "/favicon.ico",
    "/landing/galeria/escudo-historico.jpg",
    "/landing/galeria/sede-elite.webp",
    "/logo.jpg",
  ])("%s é público", (path) => expect(isPublicPath(path)).toBe(true))
})

describe("isPublicPath — rotas protegidas não são públicas", () => {
  it.each([
    "/dashboard",
    "/alunos",
    "/alunos/1",
    "/pagamentos",
    "/admin",
    "/configuracoes",
    "/frequencia",
    "/caixa",
    "/api/upload/foto",
    "/noticias",
    "/noticias/admin",
  ])("%s é protegido", (path) => expect(isPublicPath(path)).toBe(false))
})

describe("isPublicPath — não confunde prefixo com rota similar", () => {
  it.each([
    ["/login-social", false],
    ["/login-admin", false],
    ["/resultados-completos", false],
    ["/horarios-admin", false],
    ["/matricula-online", false],
    ["/api/auth-externo", false],
    ["/api/responsavel-admin", false],
    ["/api/config/publico", false],        // "public" ≠ "publico"
    ["/api/upload/matricula-pdf", false],  // não é subpath de /matricula
    ["/noticias/publicidade", false],
  ])("%s retorna %s", (path, expected) => expect(isPublicPath(path)).toBe(expected))
})
