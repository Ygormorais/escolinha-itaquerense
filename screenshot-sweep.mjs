import { chromium } from "@playwright/test"

const pages = ["dashboard", "alunos", "pagamentos", "frequencia", "inadimplencia", "relatorio"]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto("http://localhost:3000/login")
await page.locator("#login-usuario").fill("admin")
await page.locator("#login-senha").fill("admin")
await page.keyboard.press("Enter")
await page.waitForURL("**/dashboard**", { timeout: 15000 }).catch(() => page.waitForTimeout(3000))
// dispensa onboarding se aparecer
const pular = page.getByText("Pular", { exact: true })
if (await pular.isVisible().catch(() => false)) await pular.click()

for (const p of pages) {
  await page.goto(`http://localhost:3000/${p}`)
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `../sweep-${p}.png`, fullPage: true })
}
await browser.close()
