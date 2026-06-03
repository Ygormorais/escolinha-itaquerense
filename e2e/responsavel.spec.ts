import { test, expect } from "@playwright/test"

test.describe("Portal do Responsável", () => {
  test("página de login carrega", async ({ page }) => {
    await page.goto("/responsavel/login")
    await expect(page.getByRole("heading", { name: "Entrar", exact: true })).toBeVisible()
  })

  test("campo email e senha existem", async ({ page }) => {
    await page.goto("/responsavel/login")
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test("login com credenciais erradas mostra erro", async ({ page }) => {
    await page.goto("/responsavel/login")
    await page.fill('input[type="email"]', "naoexiste@test.com")
    await page.fill('input[type="password"]', "senhaerrada")
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)
    await expect(page.locator("text=incorretos")).toBeVisible()
  })
})
