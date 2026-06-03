import { test, expect } from "@playwright/test"

test("debug login full flow", async ({ page }) => {
  await page.goto("/login")
  await page.waitForLoadState("networkidle")
  
  // Wait a bit for hydration
  await page.waitForTimeout(1000)
  
  // Fill fields
  await page.locator("#login-usuario").fill("admin")
  await page.locator("#login-senha").fill("escolinha123")
  
  console.log("Fields filled")
  
  // Check button
  const btn = page.locator('button[type="submit"]')
  console.log("Button disabled:", await btn.isDisabled())
  console.log("Button visible:", await btn.isVisible())
  console.log("Button text:", await btn.textContent())
  
  // Click and wait for navigation
  await Promise.all([
    page.waitForURL("http://localhost:3000/", { timeout: 5000 }),
    btn.click(),
  ])
  
  console.log("Login succeeded!")
  
  // Check for onboarding overlay
  const overlay = page.locator(".fixed.inset-0.z-50")
  console.log("Onboarding overlay visible:", await overlay.isVisible())
})
