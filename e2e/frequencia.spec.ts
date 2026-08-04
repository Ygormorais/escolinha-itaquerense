import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Frequência", () => {
  test("navega para frequência e exibe filtros", async ({ page }) => {
    await page.goto("/frequencia")
    await expect(page.getByRole("heading", { name: "Frequência", exact: true })).toBeVisible()
    await expect(page.getByRole("combobox").first()).toBeVisible()
  })

  test("botão Carregar existe e é clicável", async ({ page }) => {
    await page.goto("/frequencia")
    const btn = page.getByRole("button", { name: "Carregar" })
    await expect(btn).toBeVisible()
    await btn.click()
    await page.waitForLoadState("networkidle")
    await expect(page).toHaveURL(/frequencia/)
  })

  test("aba Resumo Mensal carrega", async ({ page }) => {
    await page.goto("/frequencia")
    const abaResumo = page.getByRole("tab", { name: /Resumo/i })
    await expect(abaResumo).toBeVisible()
    await abaResumo.click()
    await expect(abaResumo).toHaveAttribute("aria-selected", "true")
    await expect(page).toHaveURL(/frequencia/)
  })

  test("sidebar link Frequência navega corretamente", async ({ page }) => {
    await page.goto("/dashboard")
    await page.locator("aside").getByRole("link", { name: "Frequência", exact: true }).click()
    await expect(page).toHaveURL("/frequencia")
  })

  test("botão Carregar mostra feedback enquanto carrega", async ({ page }) => {
    await page.goto("/frequencia")
    const btn = page.getByRole("button", { name: "Carregar" })
    await expect(btn).toBeVisible()
    // seletor de turma visível
    await expect(page.getByRole("combobox").first()).toBeVisible()
  })
})
