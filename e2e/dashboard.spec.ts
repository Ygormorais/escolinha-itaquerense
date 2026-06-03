import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Dashboard", () => {
  test("carrega e mostra stat cards", async ({ page }) => {
    await expect(page.locator("text=Alunos Ativos")).toBeVisible()
    await expect(page.locator("text=Receita do Mês")).toBeVisible()
    await expect(page.locator("text=Inadimplentes")).toBeVisible()
    await expect(page.locator("text=Presença Média")).toBeVisible()
  })

  test("mostra gráficos (lazy-loaded)", async ({ page }) => {
    await expect(page.locator("text=Receita vs Custos")).toBeVisible()
    await expect(page.locator("text=Inadimplência")).toBeVisible()
  })

  test("mostra ocupação das turmas", async ({ page }) => {
    await expect(page.locator("text=Ocupação das Turmas")).toBeVisible()
    await expect(page.locator("text=Sub-7")).toBeVisible()
    await expect(page.locator("text=Sub-11")).toBeVisible()
  })

  test("MonthPicker está visível", async ({ page }) => {
    const monthPicker = page.locator('input[type="number"]')
    await expect(monthPicker.first()).toBeVisible()
  })
})
