import { test, expect } from "@playwright/test"
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
    const btn = page.locator(`a[href="${href}"]`).first()
    await expect(btn).toBeVisible()
    await btn.click()
    await expect(page).toHaveURL(href)
  })
})
