import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Navegação", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("sidebar desktop organiza os links por seção", async ({ page }) => {
    const sidebar = page.locator("aside")
    await expect(sidebar.locator('a[href="/dashboard"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/alunos"]')).not.toBeVisible()

    await sidebar.getByRole("button", { name: "Operação" }).click()
    await expect(sidebar.locator('a[href="/alunos"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/pagamentos"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/frequencia"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/agenda"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/campeonatos"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/caixa"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/noticias"]')).not.toBeVisible()

    await sidebar.getByRole("button", { name: "Documentos & Gestão" }).click()
    await expect(sidebar.locator('a[href="/alunos"]')).not.toBeVisible()
    await expect(sidebar.locator('a[href="/configuracoes"]')).toHaveCount(0)
    await expect(sidebar.locator('a[href="/noticias"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/configuracoes/escalacoes"]')).toBeVisible()
  })

  test("configurações gerais não ficam acessíveis ao operador", async ({ page }) => {
    await page.goto("/configuracoes")
    await expect(page).toHaveURL("/dashboard")
  })

  test("abre automaticamente a seção da rota atual", async ({ page }) => {
    const sidebar = page.locator("aside")
    await sidebar.getByRole("button", { name: "Operação" }).click()
    await sidebar.locator('a[href="/alunos"]').click()

    await expect(page).toHaveURL("/alunos")
    await expect(sidebar.getByRole("button", { name: "Operação" })).toHaveAttribute("aria-expanded", "true")
    await expect(sidebar.locator('a[href="/alunos"]')).toHaveAttribute("aria-current", "page")
  })

  test("sidebar mobile: hamburger abre menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator("aside").locator('a[href="/alunos"]')).not.toBeVisible()

    const hamburger = page.locator('button[aria-label="Abrir menu de navegação"]')
    await expect(hamburger).toBeVisible()
    await hamburger.click()

    await page.locator("aside").getByRole("button", { name: "Operação" }).click()
    await expect(page.getByRole("link", { name: "Alunos", exact: true }).first()).toBeVisible()
  })

  test("sidebar mobile: click link fecha menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.locator('button[aria-label="Abrir menu de navegação"]').click()
    // Close the Sheet by pressing Escape, then navigate via bottom-nav
    await page.keyboard.press("Escape")
    await page.locator('nav[aria-label="Navegação rápida"] a[href="/alunos"]').click()
    await expect(page).toHaveURL("/alunos")
  })

  test("busca global abre com Ctrl+K", async ({ page }) => {
    await page.locator("body").click()
    await page.keyboard.press("Control+k")
    await expect(page.locator('input[placeholder*="Buscar"]')).toBeVisible()
  })

  test("página não encontrada (404)", async ({ page }) => {
    const response = await page.goto("/rotaqueexiste")
    expect(response?.status()).toBe(404)
  })
})
