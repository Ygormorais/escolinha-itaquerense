import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.describe("Autenticação", () => {
  test("login com sucesso redireciona para dashboard", async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL("/dashboard")
  })

  test("login com senha errada mostra erro", async ({ page }) => {
    // não usa loginAsAdmin: o helper aguarda sair de /login (sucesso); aqui o
    // login falha de propósito e a página permanece em /login.
    await page.goto("/login")
    await page.locator("#login-usuario").fill("admin")
    await page.locator("#login-senha").fill("senhaerrada")
    await page.click('button[type="submit"]')
    await expect(page.getByText("incorretos")).toBeVisible()
  })

  test("botão desabilitado com campos vazios", async ({ page }) => {
    await page.goto("/login")
    const btn = page.locator('button[type="submit"]')
    await expect(btn).toBeDisabled()
  })

  test("logout limpa sessão", async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL("/dashboard")

    const logoutBtn = page.locator('button[aria-label="Sair do sistema"]')
    await logoutBtn.click()
    await expect(page).toHaveURL("/login")
  })

  test("já autenticado em /login mostra sessão ativa (não pula o gate)", async ({ page }) => {
    // Autentica via formulário e volta em /login: deve permanecer no gate,
    // nunca pular o formulário/sessão em silêncio para o painel.
    await loginAsAdmin(page)
    await expect(page).toHaveURL("/dashboard")

    await page.goto("/login")
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
    await expect(page.getByText("Sessão ativa")).toBeVisible()
    await expect(page.getByRole("button", { name: "Continuar para o painel" })).toBeVisible()
    await expect(page.getByRole("button", { name: /Sair e trocar de usuário/i })).toBeVisible()
  })
})
