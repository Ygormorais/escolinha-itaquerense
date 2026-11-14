import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { RECIBO_CODIGO_E2E, resetRecibosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetRecibosE2E()
  await loginAsAdmin(page)
})

test.describe("Recibos — smoke e carregamento", () => {
  test("página carrega com título 'Recibos'", async ({ page }) => {
    await page.goto("/recibos")
    await expect(page.getByRole("heading", { name: "Recibos", exact: true })).toBeVisible()
  })

  test("botão 'Emitir e imprimir' fica embaixo do formulário", async ({ page }) => {
    await page.goto("/recibos")
    await expect(page.getByRole("button", { name: /Emitir e imprimir/i })).toBeVisible()
  })

  test("card 'Novo recibo' está visível com campos do formulário", async ({ page }) => {
    await page.goto("/recibos")
    await expect(page.getByText(/Novo recibo/i)).toBeVisible()
    await expect(page.locator("#rec-referencia")).toBeVisible()
    await expect(page.locator("#rec-aluno")).toBeVisible()
    await expect(page.locator("#rec-responsavel")).toBeVisible()
    await expect(page.locator("#rec-valor")).toBeVisible()
    await expect(page.getByRole("combobox", { name: /Forma de Pagamento/i })).toBeVisible()
    await expect(page.locator("#rec-data")).toBeVisible()
  })
})

test.describe("Recibos — preenchimento do formulário", () => {
  test("preencher campos atualiza o recibo de pré-visualização", async ({ page }) => {
    await page.goto("/recibos")

    await page.locator("#rec-aluno").fill("João Silva E2E")
    await page.locator("#rec-responsavel").fill("Maria Silva E2E")
    await page.locator("#rec-referencia").fill("Junho/2025")
    await page.locator("#rec-valor").fill("150")

    // O recibo de preview (#recibo-print) deve refletir o nome do aluno
    const preview = page.locator("#recibo-print")
    await expect(preview).toBeVisible()
    await expect(preview).toContainText("João Silva E2E")
    await expect(preview).toContainText("Maria Silva E2E")
  })

  test("campo 'Valor' formata como currency no preview", async ({ page }) => {
    await page.goto("/recibos")
    await page.locator("#rec-valor").fill("200")
    const preview = page.locator("#recibo-print")
    // Preview deve mostrar R$ 200,00 ou similar
    await expect(preview).toContainText(/R\$\s*200/)
  })

  test("seletor de forma de pagamento aceita todas as opções", async ({ page }) => {
    await page.goto("/recibos")
    const formas = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]
    const trigger = page.getByRole("combobox", { name: /Forma de Pagamento/i })
    await trigger.click()
    const opcoes = await page.locator('[role="option"]').allTextContents()
    for (const forma of formas) {
      expect(opcoes.some((o) => o.includes(forma))).toBe(true)
    }
    await page.keyboard.press("Escape")
  })
})

test.describe("Recibos — histórico de recibos emitidos", () => {
  test("seção 'Recibos Emitidos' está presente na página", async ({ page }) => {
    await page.goto("/recibos")
    await expect(page.getByRole("heading", { name: /Recibos Emitidos/i })).toBeVisible()
  })

  test("histórico exibe o recibo controlado pelo fixture", async ({ page }) => {
    await page.goto("/recibos")
    await expect(page.locator("table")).toBeVisible()
    await expect(page.getByRole("cell", { name: "E2E Recibo Fixture", exact: true })).toBeVisible()
  })

  test("busca no histórico de recibos filtra por nome do aluno", async ({ page }) => {
    await page.goto("/recibos")
    await expect(page.getByRole("cell", { name: "E2E Recibo Fixture", exact: true })).toBeVisible()
    const inputBusca = page.locator('input[placeholder*="Buscar por aluno"]')
    await expect(inputBusca).toBeVisible()
    await inputBusca.fill("zzz_nao_existe_e2e_recibo")
    await expect(page.locator("table tbody tr")).toHaveCount(0)
    await inputBusca.clear()
  })
})

test.describe("Recibos — pré-preenchimento por query string", () => {
  test("query string preenche os campos automaticamente", async ({ page }) => {
    const params = new URLSearchParams({
      aluno: "Carlos Teste",
      responsavel: "Responsável Teste",
      referencia: "Maio/2025",
      valor: "180",
      forma: "Dinheiro",
    })
    await page.goto(`/recibos?${params.toString()}`)

    await expect(page.locator("#rec-aluno")).toHaveValue("Carlos Teste")
    await expect(page.locator("#rec-responsavel")).toHaveValue("Responsável Teste")
    await expect(page.locator("#rec-referencia")).toHaveValue("Maio/2025")
    await expect(page.locator("#rec-valor")).toHaveValue("180")
    await expect(page.getByRole("combobox", { name: /Forma de Pagamento/i })).toContainText("Dinheiro")
  })
})

test.describe("Recibos — página de cada recibo", () => {
  test("'Ver e imprimir' abre o recibo com QR e botão de imprimir", async ({ page }) => {
    await page.goto("/recibos")
    const linha = page.getByRole("row").filter({ hasText: "E2E Recibo Fixture" })
    await linha.getByRole("link", { name: /Ver e imprimir/i }).click()
    await expect(page).toHaveURL(/\/recibos\/\d+$/)
    await expect(page.getByRole("button", { name: /Imprimir PDF/i })).toBeVisible()
    await expect(page.locator("#recibo-print")).toContainText("E2E Recibo Fixture")
    await expect(page.getByRole("img", { name: "QR code de validação do recibo" })).toBeVisible()
  })

  test("link antigo ?codigo= leva à página do recibo", async ({ page }) => {
    await page.goto(`/recibos?codigo=${RECIBO_CODIGO_E2E}`)
    await expect(page).toHaveURL(/\/recibos\/\d+$/)
    await expect(page.locator("#recibo-print")).toContainText("E2E Recibo Fixture")
  })

  test("emitir cria o recibo e abre a página dele", async ({ page }) => {
    await page.goto("/recibos")
    await page.locator("#rec-aluno").fill("E2E Recibo Emitido")
    await page.locator("#rec-responsavel").fill("Responsável E2E")
    await page.locator("#rec-referencia").fill("2026-01")
    await page.locator("#rec-valor").fill("90")
    await page.evaluate(() => { window.print = () => {} })
    await page.getByRole("button", { name: /Emitir e imprimir/i }).click()
    await expect(page).toHaveURL(/\/recibos\/\d+\?imprimir=1$/, { timeout: 15000 })
    await expect(page.locator("#recibo-print")).toContainText("E2E Recibo Emitido")
    await expect(page.locator("#recibo-print")).toContainText(/R\$\s*90/)
  })
})
