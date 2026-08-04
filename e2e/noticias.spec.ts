import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Notícias (admin)", () => {
  test("página carrega com lista e stats", async ({ page }) => {
    await page.goto("/noticias")
    await expect(page.getByRole("heading", { name: /Notícias/i })).toBeVisible()
    await expect(page.locator("body")).not.toContainText("Application error")
  })

  test("botão nova notícia abre formulário/dialog", async ({ page }) => {
    await page.goto("/noticias")
    await page.waitForLoadState("networkidle")
    const btnNova = page.getByRole("button", { name: /Nova notícia|Nova|Publicar/i }).first()
    await expect(btnNova).toBeVisible()
    await btnNova.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Nova Notícia", exact: true })).toBeVisible()
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click()
    await expect(dialog).not.toBeVisible()
  })

  test("página pública de notícias carrega sem autenticação", async ({ page }) => {
    await page.context().clearCookies()
    await page.goto("/noticias/publico")
    await expect(page.locator("body")).not.toContainText("Application error")
    // não deve redirecionar para login
    await expect(page).not.toHaveURL(/\/login/)
  })
})
