import { test, expect } from "@playwright/test"

const RESP_STORAGE = "e2e/.auth/responsavel.json"

test.describe("Portal autenticado — calendário do aluno", () => {
  test.use({ storageState: RESP_STORAGE })

  test("portal: calendário abre, mostra o mês atual e navega de mês", async ({ page }) => {
    await page.goto("/responsavel/calendario")
    await expect(page.getByRole("heading", { name: /\p{L}+ de \d{4}/u, level: 1 })).toBeVisible()
    const proximo = page.getByRole("link", { name: "Próximo mês" })
    await expect(proximo).toBeVisible()
    await proximo.click()
    await expect(page).toHaveURL(/[?&]mes=\d{4}-\d{2}/)
    await expect(page.getByRole("link", { name: "Mês anterior" })).toBeVisible()
  })
})
