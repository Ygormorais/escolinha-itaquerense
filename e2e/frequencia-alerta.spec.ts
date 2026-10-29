import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Alerta de frequência — dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("Início mostra a presença média do mês", async ({ page }) => {
    // O cartão 'Frequência em queda' saiu do Início; quem cai abaixo de 60% com atraso
    // aparece em "Precisa de você".
    await page.goto("/dashboard")
    await expect(page.getByText("Presença média", { exact: true })).toBeVisible({ timeout: 8000 })
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
    const alerta = page.getByText(/frequência abaixo de 70%/i)
    const heatmap = page.getByText("Presença por Dia da Semana").first()
    await expect(alerta.or(heatmap).first()).toBeVisible({ timeout: 8000 })
  })
})
