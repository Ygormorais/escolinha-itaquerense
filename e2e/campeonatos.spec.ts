import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { loginAsAdmin } from "./helpers"
import { resetCampeonatoE2E } from "./fixtures"

let campeonatoId: number
let partidaId: number

test.beforeEach(async ({ page }) => {
  const fixture = await resetCampeonatoE2E()
  campeonatoId = fixture.campeonatoId
  partidaId = fixture.partidaId
  await loginAsAdmin(page)
})

test.describe("Campeonatos", () => {
  test("navega para lista de campeonatos", async ({ page }) => {
    await page.goto("/campeonatos")
    await expect(page.getByRole("heading", { name: "Campeonatos", exact: true })).toBeVisible()
  })

  test("botão novo campeonato abre dialog", async ({ page }) => {
    await page.goto("/campeonatos")
    await page.getByRole("button", { name: /Novo Campeonato/i }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
  })

  test("filtros têm rótulos visíveis e o catálogo responde à busca", async ({ page }) => {
    await page.goto("/campeonatos")
    const busca = page.getByRole("textbox", { name: "Buscar", exact: true })
    await expect(busca).toBeVisible()
    await expect(page.getByText("Status", { exact: true })).toBeVisible()
    await expect(page.getByText("Integração", { exact: true })).toBeVisible()

    await busca.fill("E2E Campeonato Fluxos")
    await expect(page.locator('[data-slot="campeonato-card"]')).toHaveCount(1)
  })

  for (const width of [320, 375, 414, 768]) {
    test(`listagem não estoura horizontalmente em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto("/campeonatos")
      await expect(page.locator('[data-slot="campeonato-catalogue"]')).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test("listagem não tem violações críticas ou sérias de acessibilidade", async ({ page }) => {
    await page.goto("/campeonatos")
    const result = await new AxeBuilder({ page }).analyze()
    const serious = result.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"
    )
    expect(serious).toEqual([])
  })

  test("detalhe do campeonato controlado carrega", async ({ page }) => {
    await page.goto(`/campeonatos/${campeonatoId}`)
    await expect(page).toHaveURL(`/campeonatos/${campeonatoId}`)
    await expect(page.getByRole("heading", { name: "E2E Campeonato Fluxos", exact: true })).toBeVisible()
    await expect(page.locator('[data-slot="partidas-section"]')).toContainText("E2E Adversário")
  })

  for (const width of [320, 375, 414, 768]) {
    test(`detalhe não estoura horizontalmente em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/campeonatos/${campeonatoId}`)
      await expect(page.locator('[data-slot="campeonato-detail-bento"]')).toBeVisible()
      await expect(page.locator('[data-slot="inscricoes-section"]')).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test("detalhe permite abrir a edição com campos rotulados", async ({ page }) => {
    await page.goto(`/campeonatos/${campeonatoId}`)
    await page.getByRole("button", { name: "Editar", exact: true }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Nome *", exact: true })).toHaveValue("E2E Campeonato Fluxos")
    await expect(page.getByText("Status", { exact: true }).last()).toBeVisible()
  })

  test("detalhe não tem violações críticas ou sérias de acessibilidade", async ({ page }) => {
    await page.goto(`/campeonatos/${campeonatoId}`)
    const result = await new AxeBuilder({ page }).analyze()
    const serious = result.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"
    )
    expect(serious).toEqual([])
  })

  test("partida controlada exibe link de Convocação", async ({ page }) => {
    await page.goto(`/campeonatos/${campeonatoId}`)
    const href = `/campeonatos/${campeonatoId}/partidas/${partidaId}/escalacao`
    const convocacaoLink = page.locator(`a[href="${href}"]:visible`).first()
    await expect(convocacaoLink).toBeVisible()
    await expect(convocacaoLink).toContainText("Convocação")
  })

})
