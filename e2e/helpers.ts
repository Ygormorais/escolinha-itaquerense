import { expect, Page } from "@playwright/test"
import { readFile } from "fs/promises"
import path from "path"
import { ADMIN_TESTE } from "./test-credentials"

const ADMIN_STORAGE = path.join(process.cwd(), "e2e", ".auth", "admin.json")

export async function loginAsAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("escolinha_onboarding_v1", "true")
  })

  const storageState = JSON.parse(await readFile(ADMIN_STORAGE, "utf8"))
  await page.context().addCookies(storageState.cookies)

  await page.goto("/dashboard")
  await page.waitForURL("**/dashboard")
}

/** Exercita o formulário real; reservado aos cenários de autenticação. */
export async function loginAsAdminViaForm(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem("escolinha_onboarding_v1", "true")
  })
  await page.goto("/login")
  await page.waitForLoadState("networkidle")
  await page.locator("#login-usuario").fill(ADMIN_TESTE.username)
  await page.locator("#login-senha").fill(ADMIN_TESTE.senha)
  const submit = page.locator('button[type="submit"]')
  await expect(submit).toBeEnabled()
  await submit.click()
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
