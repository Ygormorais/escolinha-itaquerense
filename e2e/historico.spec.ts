import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetHistoricoE2E } from "./fixtures"

test.describe("Histórico de atividade — admin", () => {
  test.beforeEach(async ({ page }) => {
    await resetHistoricoE2E()
    await loginAsAdmin(page)
  })

  test("página /historico carrega", async ({ page }) => {
    await page.goto("/historico")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("exibe filtro de tipo e usuário", async ({ page }) => {
    await page.goto("/historico")
    const combos = page.locator('[role="combobox"]')
    await expect(combos.first()).toBeVisible()
  })

  test("busca por tipo não quebra a página", async ({ page }) => {
    await page.goto("/historico")
    const combo = page.getByRole("combobox", { name: "Filtrar por tipo" })
    await combo.click()
    await page.getByRole("option", { name: "e2e_historico", exact: true }).click()
    await expect(page.getByText("E2E Histórico Fixture", { exact: true })).toBeVisible()
  })

  test("registro controlado aparece no histórico", async ({ page }) => {
    await page.goto("/historico")
    await expect(page.getByText("E2E Histórico Fixture", { exact: true })).toBeVisible()
  })
})
