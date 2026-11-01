import { expect, test } from "@playwright/test"

// Página pública: não precisa de login.
const URLS = [
  ["localhost", "/horarios"],
  // O Next em desenvolvimento bloqueia origens não listadas em allowedDevOrigins: aberta por
  // 127.0.0.1 a página aparecia, mas não hidratava e os botões ficavam sem efeito.
  ["127.0.0.1", "http://127.0.0.1:3000/horarios"],
] as const

for (const [origem, url] of URLS) {
  test.describe(`Turmas e horários (${origem})`, () => {
    test("aba Futsal Federado troca as categorias", async ({ page }) => {
      await page.goto(url)
      const federado = page.getByRole("tab", { name: /Futsal Federado/ })
      await federado.click()
      await expect(federado).toHaveAttribute("aria-selected", "true")
      await expect(page.getByRole("button", { name: "Sub-18", exact: true })).toBeVisible()
      await expect(page.getByRole("button", { name: "Sub-7", exact: true })).toHaveCount(0)
    })

    test("chip de categoria filtra e 'Todas' limpa o filtro", async ({ page }) => {
      await page.goto(url)
      const chip = page.getByRole("button", { name: "Sub-11", exact: true })
      await chip.click()
      await expect(chip).toHaveClass(/active/)
      await page.getByRole("button", { name: "Todas", exact: true }).click()
      await expect(chip).not.toHaveClass(/active/)
    })
  })
}
