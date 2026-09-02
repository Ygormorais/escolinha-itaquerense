import { test, expect } from "@playwright/test"
import { loginAsAdminViaForm } from "./helpers"

test.describe("Autenticação", () => {
  test("login com sucesso redireciona para dashboard", async ({ page }) => {
    await loginAsAdminViaForm(page)
    await expect(page).toHaveURL("/dashboard")
  })

  test("login com senha errada mostra erro", async ({ page }) => {
    // não usa loginAsAdmin: o helper aguarda sair de /login (sucesso); aqui o
    // login falha de propósito e a página permanece em /login.
    await page.goto("/login")
    await page.waitForLoadState("networkidle")
    await page.locator("#login-usuario").fill("admin")
    await page.locator("#login-senha").fill("senhaerrada")
    const submit = page.locator('button[type="submit"]')
    await expect(submit).toBeEnabled()
    await submit.click()
    await expect(page.getByText("Credenciais inválidas. Verifique seus dados e tente novamente.", { exact: true })).toBeVisible()
  })

  test("botão desabilitado com campos vazios", async ({ page }) => {
    await page.goto("/login")
    const btn = page.locator('button[type="submit"]')
    await expect(btn).toBeDisabled()
  })

  test("logout limpa sessão", async ({ page }) => {
    await loginAsAdminViaForm(page)
    await expect(page).toHaveURL("/dashboard")

    const logoutBtn = page.locator('button[aria-label="Sair do sistema"]')
    await logoutBtn.click()
    await expect(page).toHaveURL("/login")
  })

  test("sessão ativa vai ao painel e mantém troca explícita de usuário", async ({ page }) => {
    await loginAsAdminViaForm(page)
    await expect(page).toHaveURL("/dashboard")

    await page.goto("/login")
    await expect(page).toHaveURL("/dashboard")
    await page.goto("/login?trocar=1")
    await expect(page).toHaveURL(/\/login\?trocar=1/, { timeout: 10000 })
    await expect(page.getByText("Sessão ativa")).toBeVisible()
    await expect(page.getByRole("button", { name: "Continuar para o painel" })).toBeVisible()
    await expect(page.getByRole("button", { name: /Sair e trocar de usuário/i })).toBeVisible()
  })
})
