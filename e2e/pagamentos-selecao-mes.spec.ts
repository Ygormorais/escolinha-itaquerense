/**
 * E2E — Seleção em lote não vaza entre meses
 *
 * Bug: ao selecionar pendentes e trocar o mês de referência, o componente
 * de pagamentos não remonta (navegação soft do app router), então o Set de
 * seleção mantinha IDs do mês anterior — "Registrar todos" podia lançar
 * pagamentos fora da tela. A seleção deve ser limpa ao trocar de mês.
 */

import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetPagamentosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetPagamentosE2E()
  await loginAsAdmin(page)
})

test("trocar o mês de referência limpa a seleção em lote", async ({ page }) => {
  await page.goto("/pagamentos")
  await page.waitForLoadState("networkidle")

  const checkboxes = page.locator("table tbody tr input[type='checkbox']")
  expect(await checkboxes.count()).toBeGreaterThan(0)

  await checkboxes.first().check()
  await expect(page.getByText(/selecionado/i)).toBeVisible({ timeout: 3000 })

  // Troca para janeiro do próximo ano via o seletor MonthInput customizado.
  const anoAlvo = new Date().getFullYear() + 1
  await page.locator("#pag-mes").click()
  const proximoAno = page.getByRole("button", { name: "Próximo ano" })
  await proximoAno.click()
  await expect(page.getByText(String(anoAlvo), { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "jan", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`mes=${anoAlvo}-01`))

  // A barra de seleção deve ter sumido — a seleção foi limpa ao trocar de mês
  await expect(page.getByText(/selecionado/i)).toHaveCount(0)
})
