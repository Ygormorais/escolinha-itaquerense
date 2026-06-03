import { chromium } from "playwright"

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto("http://localhost:3000/login")
  
  console.log("Trying fill...")
  await page.fill('input[autocomplete="username"]', "admin")
  console.log("Filled username")
  
  await page.fill('input[autocomplete="current-password"]', "escolinha123")
  console.log("Filled password")
  
  await page.click('button[type="submit"]')
  console.log("Clicked submit")
  
  await page.waitForURL("http://localhost:3000/", { timeout: 5000 })
  console.log("URL after login:", page.url())
  
  await browser.close()
}

main()
