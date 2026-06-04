import { Page } from "@playwright/test"

export async function loginAsAdmin(page: Page, password = "escolinha123") {
  await page.addInitScript(() => {
    localStorage.setItem("escolinha_onboarding_v1", "true")
  })
  await page.goto("/login")
  await page.locator("#login-usuario").fill("admin")
  await page.locator("#login-senha").fill(password)
  await page.click('button[type="submit"]')
  // aguarda o login concluir (sessão criada + navegação para fora de /login)
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 })
}
