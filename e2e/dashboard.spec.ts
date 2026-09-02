import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Dashboard", () => {
  test("carrega e mostra stat cards", async ({ page }) => {
    await expect(page.locator("text=Alunos Ativos")).toBeVisible()
    await expect(page.locator("text=Receita do Mês")).toBeVisible()
    // exact: o card de risco de presença contém "Inadimplentes com presença..."
    await expect(page.getByText("Inadimplentes", { exact: true })).toBeVisible()
    // exact: o card de alerta de frequência também contém "Presença média ..."
    await expect(page.getByText("Presença Média", { exact: true })).toBeVisible()
  })

  test("mostra gráficos (lazy-loaded)", async ({ page }) => {
    const main = page.locator("main")
    await expect(main.locator("text=Receita vs Custos")).toBeVisible()
    await expect(main.getByText("Inadimplência — Últimos 6 meses", { exact: true })).toBeVisible()
    await expect(main.locator('[data-slot="chart-receita-custos"]')).toContainText("Entradas, saídas e saldo")
    await expect(main.locator('[data-slot="chart-inadimplencia"]')).toContainText("percentual em atraso")
    await expect(main.locator('[data-slot="chart-receita-turma"]')).toContainText("Turmas ordenadas")

    await expect(main.locator("caption", { hasText: "Receita, custos e saldo mensal" })).toHaveCount(1)
    await expect(main.locator("caption", { hasText: "taxa de inadimplência" })).toHaveCount(1)
    await expect(main.locator("caption", { hasText: "Receita recebida por turma" })).toHaveCount(1)
  })

  test("mostra ocupação das turmas", async ({ page }) => {
    const main = page.locator("main")
    await expect(main.locator("text=Ocupação das Turmas")).toBeVisible()
    await expect(main.locator("text=Sub-7").first()).toBeVisible()
    await expect(main.locator("text=Sub-11").first()).toBeVisible()
  })

  test("MonthPicker está visível", async ({ page }) => {
    // O MonthPicker usa o MonthInput customizado (<button>) entre os controles
    // de mês anterior/próximo — não há mais <input type="month"> nativo.
    const main = page.locator("main")
    await expect(main.getByRole("button", { name: "Mês anterior" }).first()).toBeVisible()
  })

  test("ignora mês inválido sem quebrar o dashboard", async ({ page }) => {
    await page.goto("/dashboard?mes=valor-invalido", { waitUntil: "domcontentloaded" })

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible()
    await expect(page.getByText("Alunos Ativos", { exact: true })).toBeVisible()
  })
})
