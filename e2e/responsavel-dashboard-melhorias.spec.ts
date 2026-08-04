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
    // Aguarda o widget e conta os 6 pills de mês dentro do flex-container
    await expect(page.getByText("Últimos 6 meses").first()).toBeVisible({ timeout: 8000 })
    const flexContainer = page.locator("text=Últimos 6 meses").first().locator("xpath=..").locator("div").first()
    const pills = flexContainer.locator("> div")
    await expect(pills).toHaveCount(6, { timeout: 8000 })
  })

  test("dashboard exibe um estado válido da agenda", async ({ page }) => {
    await page.goto("/responsavel")
    const eventos = page.getByText("Próximos eventos", { exact: true })
    const vazio = page.getByRole("heading", { name: "Nada na agenda agora", exact: true })
    const jogos = page.getByRole("link", { name: /Jogos Ver partidas/i })
    await expect(eventos.or(vazio).or(jogos).first()).toBeVisible({ timeout: 8000 })
  })

  test("aba Calendário permanece acessível no dashboard", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page.getByRole("tab", { name: "Calendário", exact: true })).toBeVisible({ timeout: 8000 })
  })
})
