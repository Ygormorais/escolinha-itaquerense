import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Pagamentos", () => {
  test("navega para pagamentos", async ({ page }) => {
    await page.locator("aside").getByRole("link", { name: "Pagamentos", exact: true }).click()
    await expect(page).toHaveURL("/pagamentos")
    await expect(page.getByRole("heading", { name: "Pagamentos", exact: true })).toBeVisible()
  })

  test("botão gerar mensalidades existe", async ({ page }) => {
    await page.goto("/pagamentos")
    const btn = page.locator('button:has-text("Gerar")')
    await expect(btn).toBeVisible()
  })
})

test.describe("Custos", () => {
  test("navega para custos", async ({ page }) => {
    await page.locator("aside").getByRole("link", { name: "Custos", exact: true }).click()
    await expect(page).toHaveURL("/custos")
    await expect(page.getByRole("heading", { name: "Custos", exact: true })).toBeVisible()
  })
})

test.describe("Frequência", () => {
  test("navega para frequência", async ({ page }) => {
    await page.click('a[href="/frequencia"]')
    await expect(page).toHaveURL("/frequencia")
  })
})
