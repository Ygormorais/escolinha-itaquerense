import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Alunos", () => {
  test("navega para lista de alunos", async ({ page }) => {
    await page.locator("aside").getByRole("link", { name: "Alunos", exact: true }).click()
    await expect(page).toHaveURL("/alunos")
    await expect(page.getByRole("heading", { name: "Alunos", exact: true })).toBeVisible()
  })

  test("botão novo aluno abre dialog", async ({ page }) => {
    await page.goto("/alunos")
    await page.click('button:has-text("Novo")')
    await expect(page.getByRole("dialog").getByText("Novo Aluno")).toBeVisible()
  })

  test("campo de busca existe", async ({ page }) => {
    await page.goto("/alunos")
    const search = page.locator('input[placeholder*="Buscar"]')
    await expect(search).toBeVisible()
  })
})
