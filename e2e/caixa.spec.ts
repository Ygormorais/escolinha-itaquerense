import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetPagamentosE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetPagamentosE2E()
  await loginAsAdmin(page)
})

test.describe("Caixa — visão geral", () => {
  test("dashboard do caixa carrega com stats", async ({ page }) => {
    await page.goto("/caixa")
    await expect(page.getByRole("heading", { name: /Caixa/i })).toBeVisible()
    await expect(page.getByText("Total Recebido (mês)", { exact: true })).toBeVisible()
    await expect(page.getByText("Saldo", { exact: true })).toBeVisible()
  })

  test("aba Recebimentos carrega", async ({ page }) => {
    await page.goto("/caixa/recebimentos")
    await expect(page.locator("body")).toBeVisible()
    await expect(page.getByRole("heading", { name: /Recebimento/i })).toBeVisible()
  })

  test("aba PIX carrega", async ({ page }) => {
    await page.goto("/caixa/pix")
    await expect(page.getByRole("heading", { name: "PIX", exact: true })).toBeVisible()
  })

  test("aba Boleto carrega", async ({ page }) => {
    await page.goto("/caixa/boleto")
    await expect(page.getByRole("heading", { name: "Boleto", exact: true })).toBeVisible()
  })

  test("aba Dinheiro carrega", async ({ page }) => {
    await page.goto("/caixa/dinheiro")
    await expect(page.getByRole("heading", { name: "Dinheiro", exact: true })).toBeVisible()
  })
})

test.describe("Caixa — recebimentos confirmados", () => {
  test("pagamento confirmado aparece na lista de recebimentos", async ({ page }) => {
    await page.goto("/caixa/recebimentos")
    const aluno = page.getByRole("link", { name: "E2E Aluno Pagamentos Pago", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    await expect(linha).toBeVisible()
    await expect(linha.getByRole("cell", { name: "PIX", exact: true })).toBeVisible()
  })
})

test.describe("Caixa — descontos", () => {
  test("página de descontos carrega", async ({ page }) => {
    await page.goto("/caixa/descontos")
    await expect(page.getByRole("heading", { name: "Descontos", exact: true })).toBeVisible()
  })
})

test.describe("Relatório financeiro", () => {
  test("relatório anual carrega com gráficos", async ({ page }) => {
    await page.goto("/relatorio")
    await expect(page.getByRole("heading", { name: /Relatório/i })).toBeVisible()
  })

  test("relatório de pagamentos carrega", async ({ page }) => {
    await page.goto("/relatorio/pagamentos")
    await expect(page.locator("body")).toBeVisible()
  })

  test("relatório de frequência carrega", async ({ page }) => {
    await page.goto("/relatorio/frequencia")
    await expect(page.locator("body")).toBeVisible()
  })

  test("relatório de alunos carrega", async ({ page }) => {
    await page.goto("/relatorio/alunos")
    await expect(page.locator("body")).toBeVisible()
  })
})
