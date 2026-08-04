import { test, expect } from "@playwright/test"
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

  test("detalhe do campeonato controlado carrega", async ({ page }) => {
    await page.goto(`/campeonatos/${campeonatoId}`)
    await expect(page).toHaveURL(`/campeonatos/${campeonatoId}`)
    await expect(page.getByRole("heading", { name: "E2E Campeonato Fluxos", exact: true })).toBeVisible()
    await expect(page.getByText("E2E Adversário", { exact: true }).first()).toBeVisible()
  })

  test("partida controlada exibe link de Convocação", async ({ page }) => {
    await page.goto(`/campeonatos/${campeonatoId}`)
    const href = `/campeonatos/${campeonatoId}/partidas/${partidaId}/escalacao`
    const convocacaoLink = page.locator(`a[href="${href}"]`).first()
    await expect(convocacaoLink).toBeVisible()
    await expect(convocacaoLink).toContainText("Convocação")
  })
})
