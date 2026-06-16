import { test, expect } from "@playwright/test"

const RESP_STORAGE = "e2e/.auth/responsavel.json"

// ── Acesso sem autenticação ────────────────────────────────────────────────
test.describe("Perfil do aluno — sem autenticação", () => {
  test("rota /responsavel/aluno/1 redireciona para login sem sessão", async ({ page }) => {
    await page.goto("/responsavel/aluno/1")
    await expect(page).toHaveURL(/\/responsavel\/login/, { timeout: 5000 })
  })
})

// ── Portal autenticado ─────────────────────────────────────────────────────
test.describe("Portal autenticado — perfil do aluno", () => {
  test.use({ storageState: RESP_STORAGE })

  test("botão 'Ver Perfil' aparece no dashboard para cada aluno", async ({ page }) => {
    await page.goto("/responsavel")
    await expect(page.getByRole("link", { name: /Ver Perfil/i }).first()).toBeVisible({ timeout: 8000 })
  })

  test("clicar em 'Ver Perfil' navega para /responsavel/aluno/[id]", async ({ page }) => {
    await page.goto("/responsavel")
    const btnPerfil = page.getByRole("link", { name: /Ver Perfil/i }).first()
    await expect(btnPerfil).toBeVisible({ timeout: 8000 })
    await btnPerfil.click()
    await expect(page).toHaveURL(/\/responsavel\/aluno\/\d+/, { timeout: 8000 })
  })

  test("página de perfil exibe link 'Voltar ao portal'", async ({ page }) => {
    await page.goto("/responsavel")
    await page.getByRole("link", { name: /Ver Perfil/i }).first().click()
    await expect(page).toHaveURL(/\/responsavel\/aluno\/\d+/, { timeout: 8000 })
    await expect(page.getByRole("link", { name: /Voltar ao portal/i })).toBeVisible()
  })

  test("página de perfil exibe nome do aluno no hero", async ({ page }) => {
    await page.goto("/responsavel")
    await page.getByRole("link", { name: /Ver Perfil/i }).first().click()
    await expect(page).toHaveURL(/\/responsavel\/aluno\/\d+/, { timeout: 8000 })
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })

  test("página de perfil exibe seção Situação Financeira", async ({ page }) => {
    await page.goto("/responsavel")
    await page.getByRole("link", { name: /Ver Perfil/i }).first().click()
    await expect(page).toHaveURL(/\/responsavel\/aluno\/\d+/, { timeout: 8000 })
    await expect(page.getByText(/Situação Financeira/i)).toBeVisible()
  })

  test("página de perfil exibe seção Frequência Recente", async ({ page }) => {
    await page.goto("/responsavel")
    await page.getByRole("link", { name: /Ver Perfil/i }).first().click()
    await expect(page).toHaveURL(/\/responsavel\/aluno\/\d+/, { timeout: 8000 })
    await expect(page.getByText(/Frequência Recente/i)).toBeVisible()
  })

  test("página de perfil exibe seção Uniformes", async ({ page }) => {
    await page.goto("/responsavel")
    await page.getByRole("link", { name: /Ver Perfil/i }).first().click()
    await expect(page).toHaveURL(/\/responsavel\/aluno\/\d+/, { timeout: 8000 })
    await expect(page.getByText(/Uniformes/i).first()).toBeVisible()
  })

  test("ID inválido (999999) redireciona para /responsavel", async ({ page }) => {
    await page.goto("/responsavel/aluno/999999")
    await expect(page).toHaveURL(/\/responsavel(\/login)?$/, { timeout: 5000 })
  })
})
