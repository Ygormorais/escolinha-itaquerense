import { test, expect } from "@playwright/test"

// Login sem o initScript dos helpers: aqui queremos o onboarding de verdade
async function loginSemSuprimirOnboarding(page: import("@playwright/test").Page) {
  await page.goto("/login")
  await page.locator("#login-usuario").fill("admin")
  await page.locator("#login-senha").fill("admin")
  await page.click('button[type="submit"]')
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 })
}

test.describe("Onboarding", () => {
  test("Pular dispensa o tour de forma persistente (não volta no reload)", async ({ page }) => {
    await loginSemSuprimirOnboarding(page)

    await expect(page.getByText("Bem-vindo!")).toBeVisible({ timeout: 15000 })
    await page.getByText("Pular", { exact: true }).click()
    await expect(page.getByText("Bem-vindo!")).toBeHidden()

    await page.reload()
    // o tour aparece via effect pós-hidratação; espera o suficiente para ele "ter chance"
    await page.waitForTimeout(2000)
    await expect(page.getByText("Bem-vindo!")).toBeHidden()
  })
})
