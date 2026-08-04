import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetAlunosFluxosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetAlunosFluxosE2E()
  await loginAsAdmin(page)
})

test.describe("Detalhe do Aluno", () => {
  test("página do primeiro aluno carrega sem erro", async ({ page }) => {
    await page.goto("/alunos")
    const link = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    await expect(link).toBeVisible()
    await link.click()

    await expect(page).toHaveURL(/\/alunos\/\d+/)
    await expect(page.locator("body")).not.toContainText("Application error")
    // heading com nome do aluno deve estar visível
    await expect(page.locator("h1").first()).toBeVisible()
  })

  test("página de aluno inexistente redireciona ou exibe 404", async ({ page }) => {
    await page.goto("/alunos/999999999")
    // isVisible() não espera — usar assertion com auto-wait no not-found real
    await expect(page.getByRole("heading", { name: /Página não encontrada/i })).toBeVisible()
  })

  test("seções de financeiro e adimplência estão presentes", async ({ page }) => {
    await page.goto("/alunos")
    const link = page.getByRole("link", { name: "E2E Aluno Fluxos Com Dados", exact: true })
    await expect(link).toBeVisible()
    await link.click()

    // a página de detalhe é scroll único com seções (sem tabs desde o redesign)
    await expect(page.getByText("Financeiro", { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/Adimplência/i).first()).toBeVisible()
  })
})

test.describe("Configurações — Categorias de Pagamento", () => {
  test("página carrega com lista de categorias", async ({ page }) => {
    await page.goto("/configuracoes/categorias")
    await expect(page.getByRole("heading", { name: /Categor/i }).first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("botão virada de mês está presente", async ({ page }) => {
    await page.goto("/configuracoes/categorias")
    await page.waitForLoadState("networkidle")
    const btn = page.getByRole("button", { name: /Virada|Gerar mensalidades/i }).first()
    await expect(btn).toBeVisible()
  })
})
