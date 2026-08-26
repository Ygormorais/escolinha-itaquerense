import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

import { loginAsAdmin } from "./helpers"

const compactWidths = [320, 375, 414, 768]

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

test.describe("Correções críticas Hallmark", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  for (const width of compactWidths) {
    test(`alunos e inadimplência não estouram em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })

      await page.goto("/alunos", { waitUntil: "networkidle" })
      await expectNoHorizontalOverflow(page)

      await page.goto("/inadimplencia", { waitUntil: "networkidle" })
      await expectNoHorizontalOverflow(page)
    })
  }

  test("alunos e inadimplência usam cartões no mobile e tabelas no desktop", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/alunos", { waitUntil: "networkidle" })
    await expect(page.locator('[data-slot="student-mobile-list"]')).toBeVisible()
    await expect(page.locator('[data-slot="student-table"]')).toBeHidden()

    await page.goto("/inadimplencia", { waitUntil: "networkidle" })
    await expect(page.locator('[data-slot="delinquency-mobile-list"]')).toBeVisible()
    await expect(page.locator('[data-slot="delinquency-table"]')).toBeHidden()

    await page.setViewportSize({ width: 1024, height: 900 })
    await expect(page.locator('[data-slot="delinquency-table"]')).toBeVisible()
  })

  test("fluxos corrigidos não têm violações críticas ou sérias", async ({ page }) => {
    for (const route of ["/alunos", "/inadimplencia", "/secretaria"]) {
      await page.goto(route, { waitUntil: "networkidle" })
      await expectNoSeriousAccessibilityViolations(page, `[data-page="${route.slice(1)}"]`)
    }
  })

  test("landing não estoura e passa Axe nas larguras prioritárias", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.locator(".lp")).toBeVisible()

    for (const width of compactWidths) {
      await page.setViewportSize({ width, height: 900 })
      await expectNoHorizontalOverflow(page)
    }

    await page.setViewportSize({ width: 390, height: 844 })
    await expectNoSeriousAccessibilityViolations(page, ".lp")

    await page.setViewportSize({ width: 1440, height: 1000 })
    await expectNoSeriousAccessibilityViolations(page, ".lp")
  })
})
