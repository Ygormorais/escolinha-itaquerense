import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { loginAsAdmin } from "./helpers"
import { resetCampeonatoE2E } from "./fixtures"

let campeonatoId: number
let partidaId: number

test.describe("Escalações Admin", () => {
  test.beforeEach(async ({ page }) => {
    const fixture = await resetCampeonatoE2E()
    campeonatoId = fixture.campeonatoId
    partidaId = fixture.partidaId
    await loginAsAdmin(page)
  })

  test("link Escalações aparece no sidebar", async ({ page }) => {
    await page.goto("/dashboard")
    const sidebar = page.locator("aside")
    await sidebar.getByRole("button", { name: "Documentos & Config" }).click()
    await expect(sidebar.locator('a[href="/configuracoes/escalacoes"]')).toBeVisible()
  })

  test("página de escalações carrega", async ({ page }) => {
    await page.goto("/configuracoes/escalacoes")
    await expect(page.getByRole("heading", { name: /Convocações/i })).toBeVisible()
  })

  test("exibe conteúdo da página de convocações", async ({ page }) => {
    await page.goto("/configuracoes/escalacoes")
    await expect(page).toHaveURL("/configuracoes/escalacoes")
    // ou lista de partidas ou estado vazio — ambos ficam abaixo do heading
    await expect(page.locator("h1").first()).toBeVisible()
  })
})

test.describe("Escalação de Partida (board)", () => {
  test.beforeEach(async ({ page }) => {
    const fixture = await resetCampeonatoE2E()
    campeonatoId = fixture.campeonatoId
    partidaId = fixture.partidaId
    await loginAsAdmin(page)
  })

  test("botão Convocação da partida controlada abre o board", async ({ page }) => {
    await page.goto(`/campeonatos/${campeonatoId}`)
    const href = `/campeonatos/${campeonatoId}/partidas/${partidaId}/escalacao`
    const btn = page.locator(`a[href="${href}"]:visible`).first()
    await expect(btn).toBeVisible()
    await btn.click()
    await expect(page).toHaveURL(href)
  })

  for (const width of [320, 375, 414, 768]) {
    test(`board não estoura horizontalmente em ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`/campeonatos/${campeonatoId}/partidas/${partidaId}/escalacao`)
      await expect(page.locator('[data-slot="escalacao-control-room"]')).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test("filtros são rotulados e jogador pode ser adicionado por clique", async ({ page }) => {
    await page.goto(`/campeonatos/${campeonatoId}/partidas/${partidaId}/escalacao`)
    await expect(page.getByText("Turma", { exact: true })).toBeVisible()
    await expect(page.getByRole("textbox", { name: "Buscar" })).toBeVisible()
    const jogador = page.getByRole("button", { name: /^Adicionar .+ à escalação$/ }).first()
    const nomeAcessivel = await jogador.getAttribute("aria-label")
    await jogador.click()
    await expect(page.getByRole("button", { name: nomeAcessivel ?? "" })).toHaveCount(0)
  })

  test("board não tem violações críticas ou sérias de acessibilidade", async ({ page }) => {
    await page.goto(`/campeonatos/${campeonatoId}/partidas/${partidaId}/escalacao`)
    const result = await new AxeBuilder({ page }).analyze()
    const serious = result.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"
    )
    expect(serious).toEqual([])
  })

})
