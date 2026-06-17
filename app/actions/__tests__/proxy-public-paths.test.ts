import { describe, it, expect } from "vitest"
import { isPublicPath } from "@/proxy"

describe("isPublicPath — rotas externas com auth própria", () => {
  // Estas rotas são chamadas por sistemas externos SEM cookie de sessão e
  // validam internamente (assinatura/secret). Precisam passar pelo proxy,
  // senão ficam inalcançáveis em produção (regressão silenciosa).
  it.each([
    "/api/webhooks/mercadopago",
    "/api/cron/lembretes",
    "/api/cron/fpfs",
    "/api/sync/fpfs",
    "/api/whatsapp/webhook",
    "/api/whatsapp/reativar",
    "/api/health",
    "/api/responsavel/auth",
    "/api/push/subscribe",
    "/api/config/public",
    "/api/upload/matricula",
  ])("%s é pública (proxy não bloqueia)", (path) => {
    expect(isPublicPath(path)).toBe(true)
  })
})

describe("isPublicPath — rotas de admin permanecem protegidas", () => {
  it.each([
    "/dashboard",
    "/pagamentos",
    "/custos",
    "/configuracoes/usuarios",
    "/api/alunos/1/print",
    "/api/upload/foto",
  ])("%s NÃO é pública (proxy exige sessão)", (path) => {
    expect(isPublicPath(path)).toBe(false)
  })
})
