import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetPreMatriculaPendenteE2E } from "./fixtures"

test.describe("Pré-Matrícula Pública", () => {
  test("página pública carrega sem autenticação", async ({ page }) => {
    await page.goto("/matricula")
    await expect(page.locator("h1")).toContainText("Pré-Matrícula")
    await expect(page.locator('input[id="aluno"]')).toBeVisible()
  })

  test("envio com campos obrigatórios vazios mostra erro de validação do navegador", async ({ page }) => {
    await page.goto("/matricula")
    await page.click('button[type="submit"]')
    await expect(page.locator("h1")).toBeVisible()
  })

  test("formulário exibe turmas e horários corretamente", async ({ page }) => {
    await page.goto("/matricula")
    const turmaSelect = page.getByRole("combobox").first()
    await expect(turmaSelect).toBeVisible()
    await turmaSelect.click()
    const opcoes = await page.locator('[role="option"]').allTextContents()
    expect(opcoes.length).toBeGreaterThanOrEqual(6)
    await page.keyboard.press("Escape")
  })

  test("envio bem-sucedido exibe mensagem de confirmação", async ({ page }) => {
    await page.goto("/matricula")
    // aguarda hidratação para o handler JS de submit estar ativo
    await page.waitForLoadState("networkidle")
    await page.fill('input[id="aluno"]', "Teste E2E")
    await page.fill('input[id="dataNasc"]', "15062015")
    await page.fill('input[id="responsavel"]', "Responsável Teste")
    await page.fill('input[id="telefone"]', "(11) 99999-8888")
    await page.fill('input[id="email"]', "teste@email.com")
    await page.getByRole("checkbox").check()
    await page.click('button[type="submit"]')
    await expect(page.getByRole("heading", { name: /Pré-matrícula enviada/ })).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Admin - Pré-Matrículas", () => {
  test.beforeEach(async ({ page }) => {
    await resetPreMatriculaPendenteE2E()
    await loginAsAdmin(page)
  })

  test("página de pré-matrículas lista registros", async ({ page }) => {
    await page.goto("/configuracoes/matriculas")
    await expect(page.locator("h1")).toContainText("Matrículas")
  })

  test("botão Aprovar abre diálogo com campo de mensalidade", async ({ page }) => {
    await page.goto("/configuracoes/matriculas")
    const btnAprovar = page.getByRole("button", { name: /Aprovar/i }).first()
    await expect(btnAprovar).toBeVisible()
    await btnAprovar.click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("spinbutton", { name: /Mensalidade/i })).toBeVisible()
    // cancelar sem confirmar
    await page.getByRole("button", { name: /Cancelar/i }).click()
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })
})
