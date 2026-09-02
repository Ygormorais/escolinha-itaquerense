import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { loginAsAdmin } from "./helpers"
import { resetSolicitacaoE2E } from "./fixtures"

test.describe("Solicitações — painel admin", () => {
  test.beforeEach(async ({ page }) => {
    await resetSolicitacaoE2E()
    await loginAsAdmin(page)
  })

  test("página /configuracoes/solicitacoes carrega", async ({ page }) => {
    await page.goto("/configuracoes/solicitacoes")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("500")
  })

  test("exibe campo de busca e filtro de status", async ({ page }) => {
    await page.goto("/configuracoes/solicitacoes")
    await expect(page.getByLabel("Buscar", { exact: true })).toBeVisible()
    await expect(page.getByLabel("Status", { exact: true })).toBeVisible()
    await expect(page.locator('[role="combobox"]').first()).toBeVisible()
  })

  test("filtro 'Pendentes' não quebra a página", async ({ page }) => {
    await page.goto("/configuracoes/solicitacoes")
    const filtro = page.locator('[role="combobox"]').first()
    await filtro.click()
    await page.getByRole("option", { name: "Pendentes", exact: true }).click()
    await expect(page.getByText("E2E Solicitação Pendente", { exact: true })).toBeVisible()
  })

  test("estado vazio aparece quando não há solicitações no filtro", async ({ page }) => {
    await page.goto("/configuracoes/solicitacoes")
    // busca por algo que não existe
    const busca = page.getByLabel("Buscar", { exact: true })
    await busca.fill("zzz_nao_existe_xyx")
    await expect(page.getByText("Nenhuma solicitação encontrada.", { exact: true })).toBeVisible()
  })

  test("link de solicitações existe na sidebar ou nav de configurações", async ({ page }) => {
    await page.goto("/configuracoes/solicitacoes")
    const link = page.locator('a[href="/configuracoes/solicitacoes"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("aria-current", "page")
  })
})

test.describe("Solicitações — fluxo completo (responsável cria → admin responde)", () => {
  test.beforeEach(async ({ page }) => {
    await resetSolicitacaoE2E()
    await loginAsAdmin(page)
  })

  test("admin vê solicitações existentes e pode responder", async ({ page }) => {
    await page.goto("/configuracoes/solicitacoes")

    const solicitacao = page.locator("article").filter({ hasText: "E2E Solicitação Pendente" })
    await expect(solicitacao).toBeVisible()
    await solicitacao.getByRole("button", { name: "Responder", exact: true }).click()
    await expect(solicitacao.getByPlaceholder("Escreva sua resposta...")).toBeVisible()
    await expect(solicitacao.getByRole("button", { name: "Resolver", exact: true })).toBeVisible()
    await expect(solicitacao.getByRole("button", { name: "Recusar", exact: true })).toBeVisible()
  })

  for (const width of [320, 375, 414, 768]) {
    test(`triagem não estoura horizontalmente em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto("/configuracoes/solicitacoes")
      await expect(page.locator('[data-slot="solicitacoes-triage"]')).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test("triagem não tem violações críticas ou sérias de acessibilidade", async ({ page }) => {
    await page.goto("/configuracoes/solicitacoes")
    const result = await new AxeBuilder({ page }).analyze()
    const serious = result.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")
    expect(serious).toEqual([])
  })
})
