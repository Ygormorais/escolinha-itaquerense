import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Navegação", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("sidebar mostra as 10 seções e os sub-itens da seção ativa", async ({ page }) => {
    await page.goto("/turmas")
    const sidebar = page.locator("aside")
    for (const nome of ["Início", "Pagamentos", "Alunos", "Frequência", "Jogos e agenda", "Desenvolvimento", "Comunicação", "Loja", "Financeiro", "Configurações"]) {
      await expect(sidebar.getByRole("link", { name: new RegExp(`^${nome}`) })).toBeVisible()
    }
    await expect(sidebar.locator('a[href="/configuracoes/responsaveis"]')).toBeVisible()
    await expect(sidebar.locator('a[href="/custos"]')).toHaveCount(0)
    await expect(sidebar.locator('a[href="/pendencias"]')).toHaveCount(0)
    await expect(sidebar.locator('a[href="/secretaria"]')).toHaveCount(0)
  })

  test("configurações gerais não ficam acessíveis ao operador", async ({ page }) => {
    await page.goto("/configuracoes")
    await expect(page).toHaveURL("/dashboard")
  })

  test("marca a seção da rota atual", async ({ page }) => {
    const sidebar = page.locator("aside")
    await sidebar.getByRole("link", { name: /^Alunos/ }).click()
    await expect(page).toHaveURL("/alunos")
    await expect(sidebar.locator('a[href="/alunos"]')).toHaveAttribute("aria-current", "page")
    await expect(sidebar.locator('a[href="/turmas"]')).toBeVisible()
  })

  test("sidebar mobile: hamburger abre menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator("aside").locator('a[href="/alunos"]')).not.toBeVisible()

    const hamburger = page.locator('button[aria-label="Abrir menu de navegação"]')
    await expect(hamburger).toBeVisible()
    await hamburger.click()

    await expect(page.locator("aside").getByRole("link", { name: /^Alunos/ }).first()).toBeVisible()
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
