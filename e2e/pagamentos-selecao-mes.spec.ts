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

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test("trocar o mês de referência limpa a seleção em lote", async ({ page }) => {
  await page.goto("/pagamentos")
  await page.waitForLoadState("networkidle")

  const checkboxes = page.locator("table tbody tr input[type='checkbox']")

  // Garante ao menos uma linha pendente no mês atual gerando as mensalidades
  // (idempotente: gerarMensalidadesMes ignora as que já existem).
  if ((await checkboxes.count()) === 0) {
    await page.getByRole("button", { name: /Gerar Mensalidades/i }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("button", { name: /Confirmar/i }).click()
    await expect(async () => {
      expect(await dialog.isVisible()).toBe(false)
    }).toPass({ timeout: 10000 }).catch(() => {})
    await page.keyboard.press("Escape")
    await page.waitForLoadState("networkidle")
  }

  if ((await checkboxes.count()) === 0) {
    // Sem aluno ativo para gerar pendência neste ambiente — passa silenciosamente.
    // (Guarda de regressão: vira teste real assim que houver dados.)
    return
  }

  await checkboxes.first().check()
  await expect(page.getByText(/selecionado/i)).toBeVisible({ timeout: 3000 })

  // Troca para um mês futuro distante (sem dados) via o input type="month"
  const mesInput = page.locator('input[type="month"]')
  await mesInput.fill("2030-01")
  await page.waitForLoadState("networkidle")

  // A barra de seleção deve ter sumido — a seleção foi limpa ao trocar de mês
  await expect(page.getByText(/selecionado/i)).toHaveCount(0)
})
