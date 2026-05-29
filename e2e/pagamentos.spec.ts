import { test, expect } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("/login")
  await page.fill('input[placeholder*="usuario"]', "admin")
  await page.fill('input[placeholder*="senha"]', "escolinha123")
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL("/")
})

test.describe("Pagamentos", () => {
  test("navega para pagamentos", async ({ page }) => {
    await page.click('a[href="/pagamentos"]')
    await expect(page).toHaveURL("/pagamentos")
    await expect(page.locator("text=Pagamentos")).toBeVisible()
  })

  test("botão gerar mensalidades existe", async ({ page }) => {
    await page.goto("/pagamentos")
    const btn = page.locator('button:has-text("Gerar")')
    await expect(btn).toBeVisible()
  })
})

test.describe("Custos", () => {
  test("navega para custos", async ({ page }) => {
    await page.click('a[href="/custos"]')
    await expect(page).toHaveURL("/custos")
    await expect(page.locator("text=Custos")).toBeVisible()
  })
})

test.describe("Frequência", () => {
  test("navega para frequência", async ({ page }) => {
    await page.click('a[href="/frequencia"]')
    await expect(page).toHaveURL("/frequencia")
  })
})
