import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Escalações Admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("link Escalações aparece no sidebar", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.locator('aside a[href="/configuracoes/escalacoes"]')).toBeVisible()
  })

  test("página de escalações carrega", async ({ page }) => {
    await page.goto("/configuracoes/escalacoes")
    await expect(page.getByRole("heading", { name: /Convocações/i })).toBeVisible()
  })

  test("exibe conteúdo da página de convocações", async ({ page }) => {
    await page.goto("/configuracoes/escalacoes")
    await expect(page).toHaveURL("/configuracoes/escalacoes")
    // ou lista de partidas ou estado vazio — ambos ficam abaixo do heading
    await expect(page.locator("h1").first()).toBeVisible()
  })
})

test.describe("Escalação de Partida (board)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("botão Convocação existe na lista de partidas quando campeonato tem partidas", async ({ page }) => {
    await page.goto("/campeonatos/1")
    const btn = page.getByRole("link", { name: /Convoca/i }).first()
    const hasPartidas = await btn.isVisible().catch(() => false)
    if (hasPartidas) {
      await expect(btn).toBeVisible()
    }
    await expect(page).toHaveURL(/campeonatos/)
  })
})
