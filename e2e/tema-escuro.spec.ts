import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

import { loginAsAdmin } from "./helpers"

// O tema escuro vem do localStorage (components/theme-script.tsx) e fica salvo no aparelho,
// inclusive depois de sair do admin. Portal e login devem continuar claros e legíveis.
async function salvarTemaEscuro(page: Page) {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"))
}

async function violacoesSerias(page: Page, selector: string) {
  const results = await new AxeBuilder({ page }).include(selector).withTags(["wcag2a", "wcag2aa"]).analyze()
  return results.violations.filter((v) => v.impact === "critical" || v.impact === "serious")
}

test.describe("Tema escuro salvo — telas sempre claras", () => {
  test("login continua legível", async ({ page }) => {
    await salvarTemaEscuro(page)
    await page.goto("/login", { waitUntil: "networkidle" })
    expect(await violacoesSerias(page, "body")).toEqual([])
  })

  test.describe("portal", () => {
    test.use({ storageState: "e2e/.auth/responsavel.json" })

    test("início do portal continua legível", async ({ page }) => {
      await salvarTemaEscuro(page)
      await page.goto("/responsavel", { waitUntil: "networkidle" })
      expect(await violacoesSerias(page, "body")).toEqual([])
    })

    test("barra escura do portal tem contraste, inclusive o sino", async ({ page }) => {
      await page.goto("/responsavel", { waitUntil: "networkidle" })
      expect(await violacoesSerias(page, "nav")).toEqual([])
      const sino = page.getByRole("button", { name: /notifica/i }).first()
      const cor = await sino.evaluate((el) => getComputedStyle(el.querySelector("svg") ?? el).color)
      // Ícone sobre #0B0B0B precisa de pelo menos 3:1: canais claros (> 120).
      const [r, g, b] = cor.match(/\d+/g)!.map(Number)
      expect(Math.min(r, g, b)).toBeGreaterThan(120)
    })
  })
})

test.describe("Tema escuro do admin — recibo", () => {
  test("recibo continua claro e legível", async ({ page }) => {
    await loginAsAdmin(page)
    await salvarTemaEscuro(page)
    await page.goto("/recibos", { waitUntil: "networkidle" })
    expect(await violacoesSerias(page, "#recibo-print")).toEqual([])
  })
})

test.describe("Tema escuro do admin — tabelas", () => {
  test("linha de tabela não fica avermelhada fora do hover", async ({ page }) => {
    await loginAsAdmin(page)
    await salvarTemaEscuro(page)
    await page.goto("/pagamentos", { waitUntil: "networkidle" })
    await page.mouse.move(0, 0)
    const fundo = await page.locator('[data-slot="table-row"]').nth(1).evaluate((el) => getComputedStyle(el).backgroundColor)
    const canais = fundo.match(/[\d.]+/g)!.map(Number)
    const alfa = canais[3] ?? 1
    // Transparente, ou sem tom vermelho dominante.
    expect(alfa === 0 || canais[0] - canais[2] < 20).toBe(true)
  })
})
