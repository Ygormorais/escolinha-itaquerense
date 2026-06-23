import { Page } from "@playwright/test"
import { ADMIN_TESTE } from "./test-credentials"

export async function loginAsAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("escolinha_onboarding_v1", "true")
  })
  await page.goto("/login")
  await page.locator("#login-usuario").fill(ADMIN_TESTE.username)
  await page.locator("#login-senha").fill(ADMIN_TESTE.senha)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 })
}

/** Login como responsável usando o formulário */
export async function loginAsResponsavel(page: Page, email: string, senha: string) {
  await page.goto("/responsavel/login")
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', senha)
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => u.pathname === "/responsavel", { timeout: 15000 })
}
