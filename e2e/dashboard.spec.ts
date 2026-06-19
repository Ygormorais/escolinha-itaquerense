import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Dashboard", () => {
  test("carrega e mostra stat cards", async ({ page }) => {
    await expect(page.locator("text=Alunos Ativos")).toBeVisible()
    await expect(page.locator("text=Receita do Mês")).toBeVisible()
    await expect(page.locator("text=Inadimplentes")).toBeVisible()
    // exact: o card de alerta de frequência também contém "Presença média ..."
    await expect(page.getByText("Presença Média", { exact: true })).toBeVisible()
  })

  test("mostra gráficos (lazy-loaded)", async ({ page }) => {
    const main = page.locator("main")
    await expect(main.locator("text=Receita vs Custos")).toBeVisible()
    await expect(main.locator("text=Inadimplência")).toBeVisible()
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
})
