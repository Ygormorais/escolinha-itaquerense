import { beforeEach, describe, expect, it } from "vitest"
import { NextRequest } from "next/server"
import { proxy } from "@/proxy"
import { createSession, cookieName } from "@/lib/session"

beforeEach(() => {
  process.env.SESSION_SECRET = "test-proxy-rbac-secret-with-enough-entropy"
})

async function requestAs(pathname: string, role: "admin" | "secretaria" | "tecnico") {
  const token = await createSession(`user-${role}`, role)
  return proxy(new NextRequest(`http://localhost${pathname}`, {
    headers: { cookie: `${cookieName()}=${token}` },
  }))
}

describe("proxy RBAC", () => {
  it("redireciona técnico que tenta abrir uma rota financeira diretamente", async () => {
    const response = await requestAs("/caixa/extrato", "tecnico")
    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe("http://localhost/dashboard?erro=acesso-negado")
  })

  it("redireciona técnico que tenta abrir relatório financeiro diretamente", async () => {
    const response = await requestAs("/relatorio", "tecnico")
    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/dashboard?erro=acesso-negado")
  })

  it("mantém o relatório de frequência disponível ao técnico", async () => {
    const response = await requestAs("/relatorio/frequencia", "tecnico")
    expect(response.status).toBe(200)
  })

  it("redireciona secretaria que tenta abrir área técnica", async () => {
    const response = await requestAs("/tecnico/saude", "secretaria")
    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/dashboard?erro=acesso-negado")
  })

  it("permite rota operacional autorizada", async () => {
    const response = await requestAs("/frequencia", "tecnico")
    expect(response.status).toBe(200)
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("permite todas as rotas ao administrador", async () => {
    const response = await requestAs("/custos", "admin")
    expect(response.status).toBe(200)
  })
})
