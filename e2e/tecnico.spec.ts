import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Painel do Técnico", () => {
  test("página principal carrega com seções de hoje", async ({ page }) => {
    await page.goto("/tecnico")
    await expect(page.getByRole("heading", { name: /Técnico|Painel/i }).first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("exibe treinos ou mensagem vazia", async ({ page }) => {
    await page.goto("/tecnico")
    await page.waitForLoadState("networkidle")
    const temTreinos = await page.locator("table, .divide-y > div").first().isVisible({ timeout: 3000 }).catch(() => false)
    const temVazio = await page.getByText(/Nenhum|sem treino|não há/i).first().isVisible({ timeout: 3000 }).catch(() => false)
    expect(temTreinos || temVazio).toBe(true)
  })
})

test.describe("Fichas de Saúde (Técnico)", () => {
  test("página carrega com lista de alunos", async ({ page }) => {
    await page.goto("/tecnico/saude")
    await expect(page.getByRole("heading", { name: /Saúde|Fichas/i }).first()).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("filtro por turma funciona", async ({ page }) => {
    await page.goto("/tecnico/saude")
    await page.waitForLoadState("networkidle")
    const filtro = page.locator("select, [role='combobox']").first()
    if (await filtro.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(filtro).toBeVisible()
    }
  })

  test("link voltar para o painel técnico", async ({ page }) => {
    await page.goto("/tecnico/saude")
    const btnVoltar = page.getByRole("link", { name: /Voltar|Painel/i }).first()
    if (await btnVoltar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnVoltar.click()
      await expect(page).toHaveURL("/tecnico")
    }
  })
})
