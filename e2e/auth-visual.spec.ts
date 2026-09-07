import { expect, test, type Page } from "@playwright/test"

async function visualTokens(page: Page, path: string) {
  await page.goto(path)
  await expect(page.locator('[data-slot="auth-card"]')).toBeVisible()
  await expect(page.getByRole("img", { name: "E.C. Itaquerense" })).toBeVisible()

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
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      logoLoaded: (document.querySelector('img[alt="E.C. Itaquerense"]') as HTMLImageElement).naturalWidth > 0,
    }
  })
}

test.describe("Autenticação — identidade visual compartilhada", () => {
  test("restrito e família usam os mesmos tokens e proporções no desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })

    const restrito = await visualTokens(page, "/login")
    const familia = await visualTokens(page, "/responsavel/login")

    expect(restrito).toEqual(familia)
    expect(restrito.horizontalOverflow).toBe(false)
    expect(restrito.logoLoaded).toBe(true)
  })

  for (const width of [320, 375, 414, 768]) {
    test(`restrito e família mantêm a composição em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })

      const restrito = await visualTokens(page, "/login")
      const familia = await visualTokens(page, "/responsavel/login")

      expect(restrito).toEqual(familia)
      expect(restrito.frameColumns.split(" ")).toHaveLength(1)
      expect(restrito.horizontalOverflow).toBe(false)
      expect(restrito.logoLoaded).toBe(true)
    })
  }

  test("recuperação e redefinição reutilizam o mesmo cartão", async ({ page }) => {
    for (const path of ["/responsavel/recuperar-senha", "/responsavel/redefinir-senha"]) {
      await page.goto(path)
      await expect(page.locator('[data-slot="auth-shell"]')).toBeVisible()
      await expect(page.locator('[data-slot="auth-card"]')).toBeVisible()
    }
  })
})
