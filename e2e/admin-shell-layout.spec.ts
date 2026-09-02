import { expect, test } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test("mantém o painel na janela sem rolagem externa ao chegar ao fim", async ({ page }, testInfo) => {
  await loginAsAdmin(page)
  await page.goto("/desenvolvimento")
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1880, height: 462 }, { width: 1280, height: 320 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    const main = page.locator("main#main-content")
    await main.evaluate((element) => { element.scrollTop = element.scrollHeight })
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const layout = await page.evaluate(() => {
      const main = document.querySelector("main#main-content")!
      return {
        viewport: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
        windowScroll: window.scrollY,
        mainTop: main.getBoundingClientRect().top,
        mainBottom: main.getBoundingClientRect().bottom,
        mainHeight: main.clientHeight,
        mainScrollHeight: main.scrollHeight,
      }
    })
    await page.screenshot({ path: testInfo.outputPath(`shell-${viewport.width}.png`) })
    expect(layout.documentHeight).toBeLessThanOrEqual(viewport.height + 1)
    expect(layout.windowScroll).toBe(0)
    expect(layout.mainTop).toBeGreaterThanOrEqual(0)
    expect(Math.abs(layout.mainBottom - viewport.height)).toBeLessThanOrEqual(1)
    expect(await main.evaluate((element) => getComputedStyle(element).position)).toBe("relative")
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (viewport.width >= 768) {
      const sidebar = await page.locator("aside:visible").boundingBox()
      expect(sidebar).not.toBeNull()
      expect(sidebar!.y).toBe(0)
      expect(Math.abs(sidebar!.height - viewport.height)).toBeLessThanOrEqual(1)
    }
  }
})
