import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetCampeonatoE2E, resetOperacionalE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetOperacionalE2E()
  await resetCampeonatoE2E()
  await loginAsAdmin(page)
})

test.describe("Painel do Técnico", () => {
  test("página principal carrega com seções de hoje", async ({ page }) => {
    await page.goto("/tecnico")
    await expect(page.getByRole("heading", { name: /Técnico|Painel/i }).first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("exibe a próxima partida controlada", async ({ page }) => {
    await page.goto("/tecnico")
    const partida = page.getByRole("link").filter({ hasText: "vs E2E Adversário" })
    await expect(partida).toBeVisible()
    await expect(partida).toContainText("E2E Campeonato Fluxos")
  })
})

test.describe("Fichas de Saúde (Técnico)", () => {
  test("página carrega com lista de alunos", async ({ page }) => {
    await page.goto("/tecnico/saude")
    await expect(page.getByRole("heading", { name: /Saúde|Fichas/i }).first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("exibe ficha médica do aluno controlado", async ({ page }) => {
    await page.goto("/tecnico/saude")
    const aluno = page.getByRole("link", { name: "E2E Aluno Operacional", exact: true })
    const ficha = page.locator(".divide-y > div").filter({ has: aluno })
    await expect(ficha).toBeVisible()
    await expect(ficha).toContainText("Amendoim")
    await expect(ficha).toContainText("O+")
  })

  test("link voltar para o painel técnico", async ({ page }) => {
    await page.goto("/tecnico/saude")
    const btnVoltar = page.getByRole("link", { name: "Painel do Técnico", exact: true })
    await expect(btnVoltar).toBeVisible()
    await btnVoltar.click()
    await expect(page).toHaveURL("/tecnico")
  })
})
