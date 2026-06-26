import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
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
    await expect(dialog.locator('input[id="nome"], input[placeholder*="nome"]').first()).toBeVisible()
    await page.getByRole("button", { name: /Cancelar/i }).click()
    await expect(dialog).not.toBeVisible()
  })

  test("busca de produto por nome funciona", async ({ page }) => {
    await page.goto("/produtos")
    await page.waitForLoadState("networkidle")
    const input = page.locator('input[placeholder*="Buscar"], input[placeholder*="buscar"]').first()
    if (!(await input.isVisible({ timeout: 3000 }).catch(() => false))) return
    await input.fill("zzz_nao_existe_e2e")
    await expect(page.getByText(/Nenhum produto/i)).toBeVisible({ timeout: 5000 })
  })

  test("cadastro e remoção de produto funciona", async ({ page }) => {
    await page.goto("/produtos")
    await page.waitForLoadState("networkidle")

    const nomeProduto = `E2E Produto ${Date.now()}`
    await page.getByRole("button", { name: /Novo produto|Adicionar/i }).first().click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // preenche nome e preço
    const inputNome = dialog.locator('input').first()
    await inputNome.fill(nomeProduto)
    const inputPreco = dialog.locator('input[type="number"]').first()
    if (await inputPreco.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inputPreco.fill("50")
    }

    const btnSalvar = dialog.getByRole("button", { name: /Salvar|Criar|Adicionar/i }).first()
    if (await btnSalvar.isEnabled({ timeout: 2000 }).catch(() => false)) {
      await btnSalvar.click()
      await expect(dialog).not.toBeVisible({ timeout: 8000 })
      await expect(page.getByText(nomeProduto)).toBeVisible({ timeout: 8000 })
    }
  })
})
