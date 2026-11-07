import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetInadimplenciaE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetInadimplenciaE2E()
  await loginAsAdmin(page)
})

test.describe("Inadimplência — agora o filtro Atrasados da central", () => {
  test("/inadimplencia redireciona para a central filtrada", async ({ page }) => {
    await page.goto("/inadimplencia")
    await expect(page).toHaveURL(/\/pagamentos\?filtro=atrasados/)
  })

  test("inadimplente controlado aparece com o valor em aberto", async ({ page }) => {
    await page.goto("/pagamentos?filtro=atrasados")
    const item = page.locator('[data-slot="lista-devedores"] li').filter({ hasText: "E2E Aluno Inadimplente" })
    await expect(item).toBeVisible()
    await expect(item).toContainText("Sub-11")
    await expect(item).toContainText("R$ 175,00")
  })

  test("marcar um aluno libera a cobrança em lote no WhatsApp", async ({ page }) => {
    await page.goto("/pagamentos?filtro=atrasados")
    await expect(page.getByRole("button", { name: /Cobrar selecionados no WhatsApp/i })).toHaveCount(0)
    await page.getByRole("checkbox", { name: "Selecionar E2E Aluno Inadimplente" }).check()
    await expect(page.getByRole("button", { name: /Cobrar selecionados no WhatsApp/i })).toBeVisible()
  })
})
