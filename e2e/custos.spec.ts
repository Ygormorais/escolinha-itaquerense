import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetCustosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetCustosE2E()
  await loginAsAdmin(page)
})

test.describe("Custos — smoke e carregamento", () => {
  test("página carrega com título e tabs", async ({ page }) => {
    await page.goto("/custos")
    await expect(page.getByRole("heading", { name: "Custos", exact: true })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Lançamentos/i })).toBeVisible()
    await expect(page.getByRole("tab", { name: /Recorrentes/i })).toBeVisible()
  })

  test("tab Lançamentos está ativa por padrão e exibe tabela", async ({ page }) => {
    await page.goto("/custos")
    const tabLancamentos = page.getByRole("tab", { name: /Lançamentos/i })
    await expect(tabLancamentos).toHaveAttribute("aria-selected", "true")
    await expect(page.locator("table")).toBeVisible()
  })

  test("tab Recorrentes exibe tabela ao clicar", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("tab", { name: /Recorrentes/i }).click()
    await expect(page.locator("table")).toBeVisible()
  })
})

test.describe("Custos — filtro de mês", () => {
  test("seletor de mês está visível com o mês atual", async ({ page }) => {
    await page.goto("/custos")
    const seletorMes = page.locator("#custos-mes")
    await expect(seletorMes).toBeVisible()
    // o MonthInput customizado é um <button> cujo rótulo é "<Mês> de <ano>"
    await expect(seletorMes).toHaveText(/de \d{4}/)
  })

  test("alterar o mês navega para URL com query ?mes=", async ({ page }) => {
    await page.goto("/custos")
    // Dirige o MonthInput customizado (substituiu o <input type="month"> nativo):
    // abre o popover, volta um ano e escolhe janeiro.
    await page.locator("#custos-mes").click()
    await page.getByRole("button", { name: "Ano anterior" }).click()
    await page.getByRole("button", { name: "jan", exact: true }).click()
    await expect(page).toHaveURL(/[?&]mes=\d{4}-01/)
    await expect(page.locator("table")).toBeVisible()
  })
})

test.describe("Custos — criar novo custo", () => {
  test("botão 'Novo Custo' abre dialog 'Registrar Custo'", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("button", { name: /Novo Custo/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /Registrar Custo/i })).toBeVisible()
  })

  test("dialog contém campos obrigatórios esperados", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("button", { name: /Novo Custo/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.locator('input[type="date"]')).toBeVisible()
    await expect(dialog.locator('input[type="number"]')).toBeVisible()
    // campos de texto: Descrição, Fornecedor, Observações
    const inputs = dialog.locator("input:not([type='date']):not([type='number']):not([type='checkbox'])")
    await expect(inputs.first()).toBeVisible()
  })

  test("fechar dialog via botão Cancelar/Close fecha o dialog", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("button", { name: /Novo Custo/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    // tenta fechar pelo botão de fechar (DialogFooter showCloseButton ou botão com aria-label Close)
    const btnFechar = dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first()
    await btnFechar.click()
    await expect(dialog).not.toBeVisible()
  })

  test("criar custo com dados válidos fecha dialog e refresca lista", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("button", { name: /Novo Custo/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Categoria via Select
    const selectCategoria = dialog.locator('[role="combobox"]').first()
    await selectCategoria.click()
    await page.getByRole("option", { name: /Outros/i }).first().click()

    // Descrição (obrigatória — o locator antigo falhava em silêncio e criava custos vazios)
    await dialog.getByLabel("Descrição").fill("Custo E2E Automático")
    await dialog.getByLabel("Fornecedor").fill("Fornecedor E2E")

    // Valor
    await dialog.locator('input[type="number"]').fill("150.00")

    await dialog.getByRole("button", { name: /Registrar|Salvar/i }).click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("cell", { name: "Custo E2E Automático", exact: true })).toBeVisible()
  })
})

test.describe("Custos — busca na lista de lançamentos", () => {
  test("busca por texto inexistente mostra mensagem de ausência", async ({ page }) => {
    await page.goto("/custos")
    await expect(page.getByRole("cell", { name: "Custo E2E Fixture", exact: true })).toBeVisible()
    const inputBusca = page.locator('input[placeholder*="Buscar"]').first()
    await expect(inputBusca).toBeVisible()
    await inputBusca.fill("zzz_nao_existe_e2e_custo")
    await expect(page.getByText(/Nenhum custo encontrado/i)).toBeVisible()
    await inputBusca.clear()
  })
})

test.describe("Custos — aba Recorrentes CRUD", () => {
  test("botão 'Novo Modelo' abre dialog de custo recorrente", async ({ page }) => {
    await page.goto("/custos")
    await page.getByRole("tab", { name: /Recorrentes/i }).click()
    const btnNovo = page.getByRole("button", { name: "Novo Modelo", exact: true })
    await expect(btnNovo).toBeVisible()
    await btnNovo.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Novo Custo Recorrente" })).toBeVisible()
    await dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first().click()
    await expect(dialog).not.toBeVisible()
  })
})
