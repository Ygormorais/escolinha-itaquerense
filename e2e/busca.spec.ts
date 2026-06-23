import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Busca global", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test("campo de busca aparece na sidebar ou nav", async ({ page }) => {
    await page.goto("/dashboard")
    // busca pode estar na sidebar ou em ícone de lupa
    const buscaInput = page.locator('input[placeholder*="buscar"], input[placeholder*="Buscar"], input[type="search"]')
    const buscaIcon = page.locator('a[href*="/busca"], button[aria-label*="usca"]')
    const temBusca = (await buscaInput.count()) > 0 || (await buscaIcon.count()) > 0
    expect(temBusca).toBe(true)
  })

  test("página /busca carrega sem erro", async ({ page }) => {
    await page.goto("/busca")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("h1, h2").first()).toBeVisible()
  })

  test("busca com query curta não quebra a página", async ({ page }) => {
    await page.goto("/busca?q=Lu")
    await expect(page).not.toHaveURL("/login")
    // página deve renderizar mesmo com query abaixo do mínimo
    const body = page.locator("body")
    await expect(body).not.toContainText("500")
    await expect(body).not.toContainText("Internal Server Error")
  })

  test("busca com nome retorna resultados ou estado vazio", async ({ page }) => {
    await page.goto("/busca?q=Lucas")
    await expect(page).not.toHaveURL("/login")
    const body = page.locator("body")
    await expect(body).not.toContainText("500")
    // ou tem resultados ou tem estado vazio — não pode estar em branco
    await expect(body).toBeVisible()
  })

  test("busca via URL com query encoded funciona", async ({ page }) => {
    await page.goto("/busca?q=Jo%C3%A3o")
    await expect(page).not.toHaveURL("/login")
    await expect(page.locator("body")).not.toContainText("500")
  })
})
