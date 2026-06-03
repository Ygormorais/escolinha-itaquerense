import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Navegação", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("sidebar desktop mostra todos os links principais", async ({ page }) => {
    await expect(page.locator('a[href="/alunos"]')).toBeVisible()
    await expect(page.locator('a[href="/pagamentos"]')).toBeVisible()
    await expect(page.locator('a[href="/frequencia"]')).toBeVisible()
    await expect(page.locator('a[href="/agenda"]')).toBeVisible()
    await expect(page.locator('a[href="/campeonatos"]')).toBeVisible()
    await expect(page.locator('a[href="/caixa"]')).toBeVisible()
    await expect(page.locator('a[href="/configuracoes"]')).toBeVisible()
  })

  test("sidebar mobile: hamburger abre menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('a[href="/alunos"]')).not.toBeVisible()

    const hamburger = page.locator('button[aria-label="Menu"]')
    await expect(hamburger).toBeVisible()
    await hamburger.click()

    await expect(page.locator('a[href="/alunos"]')).toBeVisible()
  })

  test("sidebar mobile: click link fecha menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.locator('button[aria-label="Menu"]').click()
    await page.click('a[href="/alunos"]')
    await expect(page).toHaveURL("/alunos")
  })

  test("busca global abre com Ctrl+K", async ({ page }) => {
    await page.keyboard.press("Control+k")
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible()
  })

  test("página não encontrada (404)", async ({ page }) => {
    const response = await page.goto("/rotaqueexiste")
    expect(response?.status()).toBe(404)
  })
})
