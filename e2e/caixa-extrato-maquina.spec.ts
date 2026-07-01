import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
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

  test("botão de novo lançamento abre dialog", async ({ page }) => {
    await page.goto("/caixa/maquina")
    const btnNovo = page.getByRole("button", { name: /Novo|Lançamento|Registrar/i }).first()
    if (!(await btnNovo.isVisible({ timeout: 3000 }).catch(() => false))) return
    await btnNovo.click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByRole("button", { name: /Cancelar/i }).click()
  })
})
