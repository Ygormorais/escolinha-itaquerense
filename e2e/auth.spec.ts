import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Autenticação", () => {
  test("login com sucesso redireciona para dashboard", async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL("/")
  })

  test("login com senha errada mostra erro", async ({ page }) => {
    await loginAsAdmin(page, "senhaerrada")
    await expect(page.locator("text=incorretos")).toBeVisible()
  })

  test("botão desabilitado com campos vazios", async ({ page }) => {
    await page.goto("/login")
    const btn = page.locator('button[type="submit"]')
    await expect(btn).toBeDisabled()
  })

  test("logout limpa sessão", async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL("/")

    const logoutBtn = page.locator('button[aria-label="Sair do sistema"]')
    await logoutBtn.click()
    await expect(page).toHaveURL("/login")
  })

  test("já autenticado redireciona de /login para /", async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL("/")

    await page.goto("/login")
    await expect(page).toHaveURL("/")
  })
})
