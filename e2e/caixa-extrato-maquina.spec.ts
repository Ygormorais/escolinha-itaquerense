import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetCaixaE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetCaixaE2E()
  await loginAsAdmin(page)
})

test.describe("Caixa — Extrato Bancário", () => {
  test("página carrega com título e resumo", async ({ page }) => {
    await page.goto("/caixa/extrato")
    await expect(page.getByRole("heading", { name: /Extrato Bancário/i })).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("resumo do período está presente", async ({ page }) => {
    await page.goto("/caixa/extrato")
    // o month-picker só aparece com lançamentos; o resumo é sempre renderizado
    await expect(page.getByText(/Saldo do período/i).first()).toBeVisible()
    await expect(page.getByText(/Entradas/i).first()).toBeVisible()
  })

  test("dropzone de importar extrato está presente", async ({ page }) => {
    await page.goto("/caixa/extrato")
    // o botão "Importar OFX" virou dropzone de CSV
    await expect(page.getByText(/Arraste o extrato|clique para selecionar/i).first()).toBeVisible()
  })
})

test.describe("Caixa — Maquininha", () => {
  test("página carrega com título e stats", async ({ page }) => {
    await page.goto("/caixa/maquina")
    await expect(page.getByRole("heading", { name: /Maquininha/i })).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("filtros de status estão presentes", async ({ page }) => {
    await page.goto("/caixa/maquina")
    await page.waitForLoadState("networkidle")
    // botões/tabs de filtro (Todas, Aprovadas, Pendentes...)
    const filtros = page.locator("button, [role='tab']").filter({ hasText: /Todas|Aprovadas|Pendentes/i })
    const count = await filtros.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test("transação pendente abre o diálogo de reconciliação", async ({ page }) => {
    await page.goto("/caixa/maquina")
    const nomeTransacao = page.getByRole("cell", { name: "E2E MAQUINA", exact: true })
    const linha = page.getByRole("row").filter({ has: nomeTransacao })
    await expect(linha).toBeVisible()
    const btnReconciliar = linha.getByRole("button", { name: "Reconciliar transação", exact: true })
    await expect(btnReconciliar).toBeVisible()
    await btnReconciliar.click()
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Reconciliar Transação" })).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })
})
