import { test, expect } from "@playwright/test"

test.use({ viewport: { width: 390, height: 844 } })

test("no mobile, Portal e Entrar ficam acessíveis pelo menu", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Menu" }).click()
  const nav = page.locator("nav.main")
  await expect(nav.getByRole("link", { name: "Portal da família" })).toBeVisible()
  // Admin fica fora do menu público: ícone de cadeado no header
  await expect(page.getByRole("link", { name: /Área da equipe/i })).toBeVisible()
})
