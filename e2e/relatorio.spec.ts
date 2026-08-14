import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Relatórios — admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("página /relatorio redireciona ou carrega seção padrão", async ({ page }) => {
    await page.goto("/relatorio")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("body")).not.toContainText("Application error")
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
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("/relatorio/frequencia carrega relatório de presenças", async ({ page }) => {
    await page.goto("/relatorio/frequencia")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("/relatorio/turmas carrega ocupação por turma", async ({ page }) => {
    await page.goto("/relatorio/turmas")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("relatório de alunos permite filtrar por status", async ({ page }) => {
    await page.goto("/relatorio/alunos")
    await expect(page).not.toHaveURL("/login")
    // deve haver algum controle de filtro (select, botão, chip)
    const filtro = page.locator('select, [role="combobox"], button:has-text("Ativo"), button:has-text("Status")')
    await expect(filtro.first()).toBeVisible()
    await page.getByRole("button", { name: "Todos", exact: true }).click()
    await expect(page).toHaveURL(/status=todos/)
  })

  test("relatório de pagamentos mantém busca e ano na URL", async ({ page }) => {
    await page.goto("/relatorio/pagamentos")
    await expect(page.locator('input[type="number"]')).toBeVisible()
    await page.getByPlaceholder("Buscar aluno...").fill("Teste")
    await page.getByPlaceholder("Buscar aluno...").press("Enter")
    await expect(page).toHaveURL(/q=Teste/)
  })
})
