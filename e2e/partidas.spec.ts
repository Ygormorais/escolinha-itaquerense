import { test, expect } from "@playwright/test"

test.describe("Partidas (/partidas)", () => {
  test("/resultados redireciona para /partidas", async ({ page }) => {
    await page.goto("/resultados")
    await expect(page).toHaveURL(/\/partidas$/)
    await expect(page.getByRole("heading", { level: 1, name: "Partidas" })).toBeVisible()
  })

  test("filtros de situação mudam a URL e ficam marcados", async ({ page }) => {
    await page.goto("/partidas")
    const situacao = page.getByRole("navigation", { name: "Situação" })
    await situacao.getByRole("link", { name: "Realizadas" }).click()
    await expect(page).toHaveURL(/situacao=realizados/)
    await expect(situacao.getByRole("link", { name: "Realizadas" })).toHaveAttribute("aria-current", "page")
  })

  test("cabeçalho do site leva à página de partidas", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/")
    await page.locator("nav.main").getByRole("link", { name: "Partidas" }).click()
    await expect(page).toHaveURL(/\/partidas$/)
  })
})
