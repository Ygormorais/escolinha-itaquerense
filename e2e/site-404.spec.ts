import { test, expect } from "@playwright/test"

test.describe("Página não encontrada (visitante)", () => {
  test("URL inexistente responde 404 e mostra a página, sem ir ao login", async ({ page }) => {
    const response = await page.goto("/nao-existe")
    expect(response?.status()).toBe(404)
    await expect(page).toHaveURL(/\/nao-existe$/)
    await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible()
  })

  test("caminho aninhado inexistente também dá 404", async ({ page }) => {
    const response = await page.goto("/pagina/que/nao-existe")
    expect(response?.status()).toBe(404)
  })

  test("rotas privadas continuam levando ao login", async ({ page }) => {
    await page.goto("/alunos")
    await expect(page).toHaveURL(/\/login\?next=%2Falunos/)
  })

  test("API privada continua exigindo sessão", async ({ request }) => {
    const response = await request.get("/api/alunos", { maxRedirects: 0 })
    expect(response.status()).toBe(307)
    expect(response.headers()["location"]).toContain("/login")
  })
})
