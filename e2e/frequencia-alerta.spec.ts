import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Alerta de frequência — dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("dashboard exibe StatCard 'Frequência em queda'", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Frequência em queda").first()).toBeVisible({ timeout: 8000 })
  })
})

test.describe("Alerta de frequência — estatísticas", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("tela de estatísticas carrega e gera relatório", async ({ page }) => {
    await page.goto("/frequencia")
    // Clica na aba "Estatísticas"
    await page.getByRole("tab", { name: /Estatísticas/i }).click()
    const botao = page.getByRole("button", { name: /Gerar Estatísticas/i })
    await expect(botao).toBeVisible({ timeout: 8000 })
    await botao.click()
    // Após gerar, ou há card de alerta (< 70%) ou o heatmap aparece — qualquer um confirma que renderizou
    const heatmap = page.getByText("Presença por Dia da Semana").first()
    await expect(heatmap).toBeVisible({ timeout: 8000 })
  })
})
