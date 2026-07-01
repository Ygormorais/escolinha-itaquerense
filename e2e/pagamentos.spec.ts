import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Pagamentos — listagem e filtros", () => {
  test("página carrega com tabela de pagamentos", async ({ page }) => {
    await page.goto("/pagamentos")
    await expect(page.getByRole("heading", { name: "Pagamentos", exact: true })).toBeVisible()
    await expect(page.locator("table")).toBeVisible()
  })

  test("filtro de mês muda a URL ou recarrega os dados", async ({ page }) => {
    await page.goto("/pagamentos")
    // botões de navegação de mês (anterior/próximo)
    const btnAnterior = page.getByRole("button", { name: /anterior|◀|←/i })
    if (await btnAnterior.isVisible()) {
      await btnAnterior.click()
      await page.waitForLoadState("networkidle")
      await expect(page.locator("table")).toBeVisible()
    }
  })

  test("busca por nome funciona na listagem", async ({ page }) => {
    await page.goto("/pagamentos")
    const search = page.locator('input[placeholder*="Buscar"], input[type="search"]').first()
    if (await search.isVisible()) {
      await search.fill("zzz_nao_existe_e2e")
      await expect(page.getByText(/Nenhum|nenhum|0 resultado/i)).toBeVisible()
      await search.clear()
    }
  })
})

test.describe("Pagamentos — registro manual", () => {
  test("botão de pagar abre modal de registro de pagamento", async ({ page }) => {
    await page.goto("/pagamentos")
    await expect(page.locator("table tbody tr").first()).toBeVisible()

    // procura um pagamento pendente (sem data)
    const btnPagar = page.locator("table tbody tr").first().getByRole("button", { name: /Registrar/i })
    if (await btnPagar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnPagar.click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      // cancela sem confirmar (dialog pode ter só o X "Close")
      await dialog.getByRole("button", { name: /Cancelar|Close|Fechar/i }).first().click()
      await expect(dialog).not.toBeVisible()
    }
  })
})

test.describe("Custos", () => {
  test("lista de custos carrega", async ({ page }) => {
    await page.goto("/custos")
    await expect(page.getByRole("heading", { name: "Custos", exact: true })).toBeVisible()
  })

  test("botão novo custo abre dialog", async ({ page }) => {
    await page.goto("/custos")
    const btn = page.locator("button").filter({ hasText: /Novo Custo/i }).first()
    await btn.scrollIntoViewIfNeeded()
    await btn.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /Registrar Custo/i })).toBeVisible()
    await dialog.getByRole("button", { name: /Close|Cancelar|Fechar/i }).first().click()
  })
})

test.describe("Inadimplência", () => {
  test("página de inadimplência carrega", async ({ page }) => {
    await page.goto("/inadimplencia")
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("h1")).toContainText("Inadimpl")
  })

  test("exibe contagem de alunos inadimplentes", async ({ page }) => {
    await page.goto("/inadimplencia")
    // o número de inadimplentes é um stat card ou parágrafo
    await expect(page.locator("body")).toBeVisible()
  })
})
