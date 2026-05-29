import { test, expect } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.goto("/login")
  await page.fill('input[placeholder*="usuario"]', "admin")
  await page.fill('input[placeholder*="senha"]', "escolinha123")
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL("/")
})

test.describe("Alunos", () => {
  test("navega para lista de alunos", async ({ page }) => {
    await page.click('a[href="/alunos"]')
    await expect(page).toHaveURL("/alunos")
    await expect(page.locator("text=Alunos")).toBeVisible()
  })

  test("botão novo aluno abre dialog", async ({ page }) => {
    await page.goto("/alunos")
    await page.click('button:has-text("Novo")')
    await expect(page.locator("text=Cadastrar Aluno")).toBeVisible()
  })

  test("campo de busca existe", async ({ page }) => {
    await page.goto("/alunos")
    const search = page.locator('input[placeholder*="Buscar"]')
    await expect(search).toBeVisible()
  })
})
