import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Histórico de atividade — admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("página /historico carrega", async ({ page }) => {
    await page.goto("/historico")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("500")
  })

  test("exibe filtro de tipo e usuário", async ({ page }) => {
    await page.goto("/historico")
    const combos = page.locator('[role="combobox"]')
    await expect(combos.first()).toBeVisible()
  })

  test("busca por tipo não quebra a página", async ({ page }) => {
    await page.goto("/historico")
    const combo = page.locator('[role="combobox"]').first()
    await combo.click()
    const primeiraOpcao = page.locator('[role="option"]').nth(1)
    if (await primeiraOpcao.count() > 0) {
      await primeiraOpcao.click()
    }
    await expect(page.locator("body")).not.toContainText("500")
  })

  test("registros de log aparecem ou estado vazio é exibido", async ({ page }) => {
    await page.goto("/historico")
    const temRegistros = (await page.locator("table tr, [role='row']").count()) > 1
    const temEmpty = (await page.locator("text=Nenhum registro, text=nenhum").count()) > 0
    // um dos dois deve ser verdadeiro
    expect(temRegistros || temEmpty).toBe(true)
  })
})
