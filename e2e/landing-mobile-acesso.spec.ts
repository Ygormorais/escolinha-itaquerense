import { test, expect } from "@playwright/test"

test.use({ viewport: { width: 443, height: 844 } })

test("no mobile, Portal e Entrar ficam acessíveis pelo menu", async ({ page }) => {
  await page.goto("/")
  const menu = page.getByRole("button", { name: "Menu" })
  const menuBox = await menu.boundingBox()

  expect(menuBox).not.toBeNull()
  expect(menuBox!.x).toBeGreaterThanOrEqual(0)
  expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(443)

  await menu.click()
  const nav = page.locator("nav.main")
  await expect(nav.getByRole("link", { name: "Portal da família" })).toBeVisible()
  // Admin fica fora do menu público: ícone de cadeado no header
  await expect(page.getByRole("link", { name: "Área da equipe — painel administrativo", exact: true })).toBeVisible()
})
