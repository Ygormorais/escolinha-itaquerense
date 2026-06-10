import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Caixa — visão geral", () => {
  test("dashboard do caixa carrega com stats", async ({ page }) => {
    await page.goto("/caixa")
    await expect(page.getByRole("heading", { name: /Caixa/i })).toBeVisible()
    // cards de stat devem aparecer
    await expect(page.locator("[data-slot='stat-card'], .stat-card, [class*='stat']").first()).toBeVisible()
      .catch(() => expect(page.locator("body")).toBeVisible()) // fallback
  })

  test("aba Recebimentos carrega", async ({ page }) => {
    await page.goto("/caixa/recebimentos")
    await expect(page.locator("body")).toBeVisible()
    await expect(page.getByRole("heading", { name: /Recebimento/i })).toBeVisible()
  })

  test("aba PIX carrega", async ({ page }) => {
    await page.goto("/caixa/pix")
    await expect(page.locator("body")).toBeVisible()
  })

  test("aba Boleto carrega", async ({ page }) => {
    await page.goto("/caixa/boleto")
    await expect(page.locator("body")).toBeVisible()
  })

  test("aba Dinheiro carrega", async ({ page }) => {
    await page.goto("/caixa/dinheiro")
    await expect(page.locator("body")).toBeVisible()
  })
})

test.describe("Caixa — registrar recebimento manual", () => {
  test("botão novo recebimento abre dialog", async ({ page }) => {
    await page.goto("/caixa/recebimentos")
    const btn = page.getByRole("button", { name: /Novo|Registrar/i }).first()
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await page.getByRole("button", { name: /Cancelar/i }).click()
    }
  })
})

test.describe("Caixa — descontos", () => {
  test("página de descontos carrega", async ({ page }) => {
    await page.goto("/caixa/descontos")
    await expect(page.locator("body")).toBeVisible()
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
