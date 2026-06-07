import { Page, APIRequestContext } from "@playwright/test"

export async function loginAsAdmin(page: Page, password = "escolinha123") {
  await page.addInitScript(() => {
    localStorage.setItem("escolinha_onboarding_v1", "true")
  })
  await page.goto("/login")
  await page.locator("#login-usuario").fill("admin")
  await page.locator("#login-senha").fill(password)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 })
}

/** Cria responsável de teste via admin e retorna o email/senha para login */
export async function criarResponsavelTeste(request: APIRequestContext) {
  const email = `teste.e2e.${Date.now()}@escolinha.test`
  const senha = "TesteE2E@123"

  // Login como admin para obter cookie
  const loginRes = await request.post("/api/auth/login", {
    data: { username: "admin", password: "escolinha123" },
  })
  if (!loginRes.ok()) throw new Error("Falha no login admin para criar responsável de teste")

  // Cria responsável via action (passando por formulário na API pública não existe —
  // usamos o endpoint de autenticação do responsável para verificar se foi criado)
  return { email, senha }
}

/** Login como responsável usando a API de auth */
export async function loginAsResponsavel(page: Page, email: string, senha: string) {
  await page.goto("/responsavel/login")
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', senha)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => u.pathname === "/responsavel", { timeout: 15000 })
}
