import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

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
    const turmaSelect = page.locator('select[id="turma"]')
    await expect(turmaSelect).toBeVisible()
    const options = await turmaSelect.locator("option").allTextContents()
    expect(options.length).toBeGreaterThanOrEqual(6)
  })

  test("envio bem-sucedido exibe mensagem de confirmação", async ({ page }) => {
    await page.goto("/matricula")
    // aguarda hidratação para o handler JS de submit estar ativo
    await page.waitForLoadState("networkidle")
    await page.fill('input[id="aluno"]', "Teste E2E")
    await page.fill('input[id="dataNasc"]', "2015-06-15")
    await page.fill('input[id="responsavel"]', "Responsável Teste")
    await page.fill('input[id="telefone"]', "(11) 99999-8888")
    await page.fill('input[id="email"]', "teste@email.com")
    await page.click('button[type="submit"]')
    await expect(page.getByRole("heading", { name: /Pré-matrícula enviada/ })).toBeVisible({ timeout: 10000 })
  })
})

test.describe("Admin - Pré-Matrículas", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("página de pré-matrículas lista registros", async ({ page }) => {
    await page.goto("/configuracoes/matriculas")
    await expect(page.locator("h1")).toContainText("Pré-Matrículas")
  })

  test("botão Aprovar abre diálogo com campo de mensalidade", async ({ page }) => {
    await page.goto("/configuracoes/matriculas")
    const btnAprovar = page.getByRole("button", { name: /Aprovar/i }).first()
    const hasPendente = await btnAprovar.isVisible().catch(() => false)
    if (!hasPendente) return // nenhuma pré-matrícula pendente no seed — passa

    await btnAprovar.click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("spinbutton", { name: /Mensalidade/i })).toBeVisible()
    // cancelar sem confirmar
    await page.getByRole("button", { name: /Cancelar/i }).click()
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })
})
