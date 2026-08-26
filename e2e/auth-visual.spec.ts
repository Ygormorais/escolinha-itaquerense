import { expect, test, type Page } from "@playwright/test"

async function visualTokens(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('[data-slot="auth-card"]')).toBeVisible()

  return page.evaluate(() => {
    const shell = getComputedStyle(document.querySelector('[data-slot="auth-shell"]')!)
    const frame = getComputedStyle(document.querySelector('[data-slot="auth-frame"]')!)
    const card = getComputedStyle(document.querySelector('[data-slot="auth-card"]')!)
    const brandPanel = getComputedStyle(document.querySelector('[data-slot="auth-brand-panel"]')!)
    const formPanel = getComputedStyle(document.querySelector('[data-slot="auth-form-panel"]')!)

    return {
      shellBackground: shell.backgroundColor,
      shellColor: shell.color,
      frameColumns: frame.gridTemplateColumns,
      frameRadius: frame.borderRadius,
      frameBackground: frame.backgroundColor,
      cardRadius: card.borderRadius,
      cardBackground: card.backgroundColor,
      cardPadding: card.padding,
      brandPadding: brandPanel.padding,
      formPadding: formPanel.padding,
    }
  })
}

test.describe("Autenticação — identidade visual compartilhada", () => {
  test("restrito e família usam os mesmos tokens e proporções no desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })

    const restrito = await visualTokens(page, "/login")
    const familia = await visualTokens(page, "/responsavel/login")

    expect(restrito).toEqual(familia)
  })

  test("restrito e família mantêm a mesma composição no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    const restrito = await visualTokens(page, "/login")
    const familia = await visualTokens(page, "/responsavel/login")

    expect(restrito).toEqual(familia)
    expect(restrito.frameColumns.split(" ")).toHaveLength(1)
  })

  test("recuperação e redefinição reutilizam o mesmo cartão", async ({ page }) => {
    for (const path of ["/responsavel/recuperar-senha", "/responsavel/redefinir-senha"]) {
      await page.goto(path)
      await expect(page.locator('[data-slot="auth-shell"]')).toBeVisible()
      await expect(page.locator('[data-slot="auth-card"]')).toBeVisible()
    }
  })
})
