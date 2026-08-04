import { test, expect } from "@playwright/test"
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
    await expect(page.locator('input[placeholder*="uscar"]')).toBeVisible()
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
    const busca = page.locator('input[placeholder*="uscar"]')
    await busca.fill("zzz_nao_existe_xyx")
    await expect(page.getByText("Nenhuma solicitação encontrada.", { exact: true })).toBeVisible()
  })

  test("link de solicitações existe na sidebar ou nav de configurações", async ({ page }) => {
    await page.goto("/configuracoes")
    const link = page.locator('a[href*="solicitacoes"]')
    await expect(link.first()).toBeVisible()
  })
})

test.describe("Solicitações — fluxo completo (responsável cria → admin responde)", () => {
  test("admin vê solicitações existentes e pode responder", async ({ page }) => {
    await resetSolicitacaoE2E()
    await loginAsAdmin(page)
    await page.goto("/configuracoes/solicitacoes")

    const solicitacao = page.locator(".divide-y > div").filter({ hasText: "E2E Solicitação Pendente" })
    await expect(solicitacao).toBeVisible()
    await solicitacao.getByRole("button", { name: "Responder", exact: true }).click()
    await expect(solicitacao.getByPlaceholder("Escreva sua resposta...")).toBeVisible()
    await expect(solicitacao.getByRole("button", { name: "Resolver", exact: true })).toBeVisible()
    await expect(solicitacao.getByRole("button", { name: "Recusar", exact: true })).toBeVisible()
  })
})
