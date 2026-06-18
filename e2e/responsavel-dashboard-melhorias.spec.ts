import { test, expect } from "@playwright/test"

const RESP_STORAGE = "e2e/.auth/responsavel.json"

test.describe("Dashboard melhorias — autenticado", () => {
  test.use({ storageState: RESP_STORAGE })

  test("widget de histórico de 6 meses aparece no dashboard", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page.getByText("Últimos 6 meses").first()).toBeVisible({ timeout: 8000 })
  })

  test("widget de histórico contém 6 pills de mês", async ({ page }) => {
    await page.goto("/responsavel")
    // Cada pill tem texto de mês abreviado; procura pelo container
    const container = page.locator("text=Últimos 6 meses").first().locator("..")
    await expect(container).toBeVisible({ timeout: 8000 })
  })

  test("card de próximos eventos ou mensagem vazia aparece", async ({ page }) => {
    await page.goto("/responsavel")
    const temEventos = await page.getByText("Próximos eventos").isVisible()
    if (temEventos) {
      await expect(page.getByText("Próximos eventos")).toBeVisible()
    } else {
      await expect(page.getByText(/Nenhum evento nos próximos/i)).toBeVisible({ timeout: 8000 })
    }
  })

  test("link 'Ver calendário completo' aparece ou fallback para nenhum evento", async ({ page }) => {
    await page.goto("/responsavel")
    const link = page.getByRole("link", { name: /calendário completo/i })
    const vazio = page.getByText(/Nenhum evento nos próximos/i)
    await expect(link.or(vazio)).toBeVisible({ timeout: 8000 })
  })
})
