import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetProdutosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetProdutosE2E()
  await loginAsAdmin(page)
})

test.describe("Produtos", () => {
  test("página carrega com lista de produtos", async ({ page }) => {
    await page.goto("/produtos")
    await expect(page.getByRole("heading", { name: /Produtos/i })).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("botão novo produto abre dialog de cadastro", async ({ page }) => {
    await page.goto("/produtos")
    await page.waitForLoadState("networkidle")
    const btnNovo = page.getByRole("button", { name: /Novo produto|Adicionar/i }).first()
    await expect(btnNovo).toBeVisible()
    await btnNovo.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('input[id="prod-nome"], input[placeholder*="nome"]').first()).toBeVisible()
    await dialog.getByRole("button", { name: /Cancelar|Close|Fechar/i }).first().click()
    await expect(dialog).not.toBeVisible()
  })

  test("produto controlado aparece na listagem", async ({ page }) => {
    await page.goto("/produtos")
    const linha = page.getByRole("row").filter({ hasText: "E2E Produto Fixture" })
    await expect(linha.getByRole("cell", { name: "E2E Produto Fixture", exact: true })).toBeVisible()
    await expect(linha.getByRole("cell", { name: "R$ 49,90", exact: true })).toBeVisible()
  })

  test("cadastro e remoção de produto funciona", async ({ page }) => {
    await page.goto("/produtos")
    await page.waitForLoadState("networkidle")

    const nomeProduto = `E2E Produto ${Date.now()}`
    await page.getByRole("button", { name: /Novo produto|Adicionar/i }).first().click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    await dialog.getByLabel("Nome").fill(nomeProduto)
    await dialog.getByLabel("Preço (R$)").fill("50")

    const btnSalvar = dialog.getByRole("button", { name: "Criar", exact: true })
    await expect(btnSalvar).toBeEnabled()
    await btnSalvar.click()
    await expect(dialog).not.toBeVisible({ timeout: 8000 })

    const linha = page.getByRole("row").filter({ hasText: nomeProduto })
    await expect(linha).toBeVisible({ timeout: 8000 })
    await linha.getByRole("button", { name: "Remover produto" }).click()

    const confirmacao = page.getByRole("alertdialog")
    await expect(confirmacao).toBeVisible()
    await confirmacao.getByRole("button", { name: "Remover", exact: true }).click()
    await expect(page.getByText(nomeProduto, { exact: true })).not.toBeVisible({ timeout: 8000 })
  })
})
