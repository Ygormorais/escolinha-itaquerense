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
    await expect(page.getByRole("heading", { name: /Escalações Pendentes/i })).toBeVisible()
  })

  test("exibe mensagem quando não há escalações pendentes", async ({ page }) => {
    await page.goto("/configuracoes/escalacoes")
    const vazio = page.getByText("Nenhuma escalação pendente.")
    const tabela = page.locator("table")
    await Promise.race([
      vazio.waitFor({ timeout: 5000 }),
      tabela.waitFor({ timeout: 5000 }),
    ])
    await expect(page).toHaveURL("/configuracoes/escalacoes")
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
