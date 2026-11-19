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
    await expect(dialog.getByRole("heading", { name: "Nova notícia", exact: true })).toBeVisible()
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

test.describe("Página da notícia (pública)", () => {
  test("slug inexistente ou de rascunho responde 404 sem login", async ({ page }) => {
    await page.context().clearCookies()
    const resposta = await page.goto("/noticias/publico/noticia-que-nao-existe-e2e")
    expect(resposta?.status()).toBe(404)
    await expect(page).not.toHaveURL(/\/login/)
  })

  test("cria notícia publicada, abre a página própria e compartilha no WhatsApp", async ({ page, browser }) => {
    const titulo = `Vitória no E2E ${Date.now()}`
    await page.goto("/noticias")
    await page.waitForLoadState("networkidle")
    await page.getByRole("button", { name: /Nova notícia|Nova|Publicar/i }).first().click()
    const dialog = page.getByRole("dialog")
    await dialog.getByPlaceholder("Título da notícia").fill(titulo)
    await dialog.getByLabel("Texto da matéria").fill("Primeiro parágrafo.\n\nSegundo parágrafo.")
    await dialog.getByRole("button", { name: "Salvar", exact: true }).click()
    await expect(dialog).not.toBeVisible()

    // Visitante (sem sessão) abre a página pela listagem pública.
    const visitante = await browser.newContext()
    const pub = await visitante.newPage()
    await pub.goto("/noticias/publico")
    await pub.getByRole("link", { name: new RegExp(titulo) }).click()
    await expect(pub).toHaveURL(/\/noticias\/publico\/vitoria-no-e2e-/)
    await expect(pub.getByRole("heading", { level: 1 })).toContainText(titulo)
    await expect(pub.getByText("Segundo parágrafo.")).toBeVisible()
    const wa = pub.getByRole("link", { name: /Compartilhar no WhatsApp/ })
    await expect(wa).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/)
    await expect(pub.locator('script[type="application/ld+json"]')).toHaveCount(1)
    await visitante.close()
  })
})

