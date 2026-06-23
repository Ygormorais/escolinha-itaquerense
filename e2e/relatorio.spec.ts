import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Relatórios — admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("página /relatorio redireciona ou carrega seção padrão", async ({ page }) => {
    await page.goto("/relatorio")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("body")).not.toContainText("500")
  })

  test("/relatorio/alunos carrega tabela de alunos", async ({ page }) => {
    await page.goto("/relatorio/alunos")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    // deve ter filtro de status ou tabela/lista
    const temConteudo = (await page.locator("table, [role='rowgroup'], .grid").count()) > 0 ||
                        (await page.locator("text=Ativo, text=aluno, text=Aluno").count()) > 0
    expect(temConteudo).toBe(true)
  })

  test("/relatorio/pagamentos carrega resumo financeiro", async ({ page }) => {
    await page.goto("/relatorio/pagamentos")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("500")
  })

  test("/relatorio/frequencia carrega relatório de presenças", async ({ page }) => {
    await page.goto("/relatorio/frequencia")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("500")
  })

  test("/relatorio/turmas carrega ocupação por turma", async ({ page }) => {
    await page.goto("/relatorio/turmas")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("500")
  })

  test("relatório de alunos permite filtrar por status", async ({ page }) => {
    await page.goto("/relatorio/alunos")
    await expect(page).not.toHaveURL("/login")
    // deve haver algum controle de filtro (select, botão, chip)
    const filtro = page.locator('select, [role="combobox"], button:has-text("Ativo"), button:has-text("Status")')
    await expect(filtro.first()).toBeVisible()
  })

  test("relatório de pagamentos tem seletor de mês", async ({ page }) => {
    await page.goto("/relatorio/pagamentos")
    const mesInput = page.locator('input[type="month"], select, [role="combobox"]')
    // pode ter month picker ou select de mês
    const count = await mesInput.count()
    expect(count).toBeGreaterThan(0)
  })
})
