import { test, expect } from "@playwright/test"

test.describe("Landing Pública (/)", () => {
  test("carrega sem autenticação", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL("/")
    await expect(page.locator(".lp")).toBeVisible()
  })

  test("expõe link para portal do responsável", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator('a[href="/responsavel"]').first()).toBeVisible()
  })

  test("expõe link para área administrativa", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator('a[href="/login"]').first()).toBeVisible()
  })

  test("expõe link para matrícula", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator('a[href="/matricula"]').first()).toBeAttached()
  })

  test("não exibe sidebar administrativa", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator('nav[aria-label="Navegação principal"]')).not.toBeAttached()
  })

  test("link Entrar leva ao login", async ({ page }) => {
    await page.goto("/")
    await page.locator('a[href="/login"]').first().click()
    await expect(page).toHaveURL("/login")
  })
})
