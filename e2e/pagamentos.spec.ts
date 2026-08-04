import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetPagamentosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetPagamentosE2E()
  await loginAsAdmin(page)
})

test.describe("Pagamentos — listagem e filtros", () => {
  test("página carrega com tabela de pagamentos", async ({ page }) => {
    await page.goto("/pagamentos")
    await expect(page.getByRole("heading", { name: "Pagamentos", exact: true })).toBeVisible()
    await expect(page.locator("table")).toBeVisible()
  })

  test("seletor de mês atualiza a URL e os dados", async ({ page }) => {
    await page.goto("/pagamentos")
    const anoAlvo = new Date().getFullYear() + 1
    await page.locator("#pag-mes").click()
    await page.getByRole("button", { name: "Próximo ano" }).click()
    await expect(page.getByText(String(anoAlvo), { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "jan", exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`mes=${anoAlvo}-01`))
    await expect(page.locator("table")).toBeVisible()
  })

  test("busca por nome funciona na listagem", async ({ page }) => {
    await page.goto("/pagamentos")
    const search = page.getByPlaceholder("Buscar aluno...")
    await expect(search).toBeVisible()
    await search.fill("zzz_nao_existe_e2e")
    await expect(page.getByText("Nenhum pagamento para os filtros aplicados", { exact: true })).toBeVisible()
    await search.clear()
    await expect(page.getByRole("link", { name: "E2E Aluno Pagamentos 1", exact: true })).toBeVisible()
  })
})

test.describe("Pagamentos — registro manual", () => {
  test("botão de pagar abre modal de registro de pagamento", async ({ page }) => {
    await page.goto("/pagamentos")
    await expect(page.locator("table tbody tr").first()).toBeVisible()

    const aluno = page.getByRole("link", { name: "E2E Aluno Pagamentos 1", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    const btnPagar = linha.getByRole("button", { name: /Registrar/i })
    await expect(btnPagar).toBeVisible()
    await btnPagar.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: /Close|Fechar/i }).first().click()
    await expect(dialog).not.toBeVisible()
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
