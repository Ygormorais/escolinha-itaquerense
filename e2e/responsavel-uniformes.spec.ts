import { test, expect } from "@playwright/test"

const RESP_STORAGE = "e2e/.auth/responsavel.json"

test.describe("Uniformes — sem autenticação", () => {
  test("rota /responsavel/uniformes redireciona para login", async ({ page }) => {
    await page.goto("/responsavel/uniformes")
    await expect(page).toHaveURL(/\/responsavel\/login/, { timeout: 5000 })
  })
})

test.describe("Uniformes — autenticado", () => {
  test.use({ storageState: RESP_STORAGE })

  test("link 'Uniforme' aparece no menu de navegação", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page.getByRole("tab", { name: "Uniforme", exact: true })).toBeVisible({ timeout: 8000 })
  })

  test("página /responsavel/uniformes carrega com título", async ({ page }) => {
    await page.goto("/responsavel/uniformes")
    await expect(page.getByRole("heading", { name: "Uniformes" })).toBeVisible({ timeout: 8000 })
  })

  test("exibe uniforme do aluno controlado", async ({ page }) => {
    await page.goto("/responsavel/uniformes")
    const card = page.locator('[data-slot="card"]').filter({ hasText: "E2E Aluno Responsável" })
    await expect(card).toBeVisible()
    await expect(card).toContainText("Camisa")
    await expect(card).toContainText("Pendente")
  })

  test("link 'Voltar ao portal' navega para /responsavel", async ({ page }) => {
    await page.goto("/responsavel/uniformes")
    await page.getByRole("link", { name: /Voltar ao portal/i }).click()
    await expect(page).toHaveURL("/responsavel", { timeout: 5000 })
  })
})
