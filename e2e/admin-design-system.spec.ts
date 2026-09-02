import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

import { loginAsAdmin } from "./helpers"

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }))

  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport)
}

async function expectNoSeriousAccessibilityViolations(page: Page, selector: string) {
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()

  const serious = results.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious"
  )
  expect(serious).toEqual([])
}

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Design system administrativo", () => {
  test("dashboard compacto não estoura a largura no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/dashboard", { waitUntil: "networkidle" })

    await expect(page.locator('[data-slot="dashboard-context"]')).toBeVisible()
    await expect(page.locator('[data-slot="month-picker"]')).toBeVisible()
    await expect(page.locator('[data-slot="alert-summary"]')).toHaveCount(1)
    await expectNoHorizontalOverflow(page)
  })

  test("resumo de alertas alinha os cards no desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto("/dashboard", { waitUntil: "networkidle" })

    const summary = page.locator('[data-slot="alert-summary"]')
    await expect(summary).toBeVisible()
    const visibleLinks = summary.getByRole("link", { name: /ver detalhes/i })
    expect(await visibleLinks.count()).toBeGreaterThan(1)
    const temConteudoTransbordando = await visibleLinks.evaluateAll((links) =>
      links.some((link) => link.scrollWidth > link.clientWidth),
    )
    expect(temConteudoTransbordando).toBe(false)
    const alturas = await visibleLinks.evaluateAll((links) =>
      links.map((link) => Math.round(link.getBoundingClientRect().height)),
    )
    expect(new Set(alturas).size).toBe(1)
  })

  test("pagamentos troca a tabela por cartões funcionais no mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/pagamentos", { waitUntil: "networkidle" })

    await expect(page.locator('[data-slot="payment-filter-bar"]')).toBeVisible()
    await expect(page.locator('[data-slot="payment-context-bar"]')).toBeVisible()
    const mobileContent = page.locator(
      '[data-slot="payment-mobile-list"]:visible, [data-slot="payment-empty-state"]:visible',
    )
    await expect(mobileContent).toBeVisible()
    await expect(page.locator('[data-slot="payment-table"]')).toBeHidden()
    await expectNoHorizontalOverflow(page)
  })

  test("dashboard e pagamentos não têm violações críticas ou sérias", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" })
    await expectNoSeriousAccessibilityViolations(page, '[data-page="dashboard"]')

    await page.goto("/pagamentos", { waitUntil: "networkidle" })
    await expectNoSeriousAccessibilityViolations(page, '[data-page="pagamentos"]')
  })
})
