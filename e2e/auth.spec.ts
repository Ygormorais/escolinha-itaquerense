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

  test("já autenticado redireciona de /login para /dashboard", async ({ page }) => {
    // Autentica via API: o cookie de sessão entra no jar do contexto e é enviado
    // nas navegações seguintes. (Logar pelo formulário com fetch in-page não
    // propaga o cookie de forma confiável para a navegação imediata no harness.)
    const res = await page.request.post("/api/auth/login", {
      data: { username: "admin", password: "admin" },
    })
    expect(res.ok()).toBeTruthy()

    await page.goto("/login")
    await expect(page).toHaveURL("/dashboard")
  })
})
