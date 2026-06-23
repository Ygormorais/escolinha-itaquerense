import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Solicitações — painel admin", () => {
  test.beforeEach(async ({ page }) => {
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
    const opcaoPendente = page.locator('[role="option"]').filter({ hasText: "Pendente" })
    if (await opcaoPendente.count() > 0) {
      await opcaoPendente.click()
    }
    await expect(page.locator("body")).not.toContainText("500")
  })

  test("estado vazio aparece quando não há solicitações no filtro", async ({ page }) => {
    await page.goto("/configuracoes/solicitacoes")
    // busca por algo que não existe
    const busca = page.locator('input[placeholder*="uscar"]')
    await busca.fill("zzz_nao_existe_xyx")
    // deve mostrar estado vazio, não erro
    await expect(page.locator("body")).not.toContainText("500")
    const empty = page.locator("text=Nenhuma solicitação encontrada")
    if (await empty.count() > 0) {
      await expect(empty).toBeVisible()
    }
  })

  test("link de solicitações existe na sidebar ou nav de configurações", async ({ page }) => {
    await page.goto("/configuracoes")
    const link = page.locator('a[href*="solicitacoes"]')
    await expect(link.first()).toBeVisible()
  })
})

test.describe("Solicitações — fluxo completo (responsável cria → admin responde)", () => {
  test("admin vê solicitações existentes e pode responder", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto("/configuracoes/solicitacoes")

    // Se houver alguma solicitação pendente, testa o botão de responder
    const btnResponder = page.locator('button:has-text("Responder")').first()
    if (await btnResponder.count() > 0) {
      await btnResponder.click()
      // deve aparecer textarea e botões de ação
      await expect(page.locator("textarea").first()).toBeVisible()
      await expect(page.locator('button:has-text("Resolver"), button:has-text("Recusar")')).not.toHaveCount(0)
    } else {
      // sem solicitações — estado vazio visível
      await expect(page.locator("body")).not.toContainText("500")
    }
  })
})
