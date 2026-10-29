import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Início", () => {
  test("mostra os 4 números, Precisa de você e o gráfico", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: "Início", level: 1 })).toBeVisible()
    for (const rotulo of ["Recebido no mês", "Em atraso", "Alunos ativos", "Presença média"]) {
      await expect(page.getByText(rotulo, { exact: true })).toBeVisible()
    }
    await expect(page.getByRole("heading", { name: "Precisa de você" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Recebido × previsto" })).toBeVisible()
  })

  test("não repete o que saiu do Início", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: "Início", level: 1 })).toBeVisible()
    await expect(page.getByRole("button", { name: /Gerar mensalidades/ })).toHaveCount(0)
    await expect(page.getByText("Receita vs Custos")).toHaveCount(0)
    await expect(page.getByText("Ocupação das Turmas")).toHaveCount(0)
  })

  test("mensalidades vencidas levam à inadimplência", async ({ page }) => {
    await page.goto("/dashboard")
    await page.locator('[data-slot="precisa-de-voce"]').getByRole("link", { name: /mensalidades vencidas/i }).first().click()
    await expect(page).toHaveURL(/\/inadimplencia/)
  })

  test("mês escrito por extenso com 'de' minúsculo", async ({ page }) => {
    await page.goto("/dashboard?mes=2026-10")
    await expect(page.locator("main").getByText("Outubro de 2026").first()).toBeVisible()
  })

  test("MonthPicker está visível", async ({ page }) => {
    const main = page.locator("main")
    await expect(main.getByRole("button", { name: "Mês anterior" }).first()).toBeVisible()
  })

  test("ignora mês inválido sem quebrar o Início", async ({ page }) => {
    await page.goto("/dashboard?mes=valor-invalido", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("heading", { name: "Início", level: 1 })).toBeVisible()
    await expect(page.getByText("Alunos ativos", { exact: true })).toBeVisible()
  })

  test("Início cabe no mobile", async ({ page }) => {
    for (const width of [320, 375, 414, 768]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto("/dashboard")
      await expect(page.locator('[data-slot="inicio-numeros"]')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    }
  })
})
