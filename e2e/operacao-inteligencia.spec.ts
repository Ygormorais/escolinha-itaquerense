import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => { await loginAsAdmin(page) })

test("automações exibem configuração e histórico local", async ({ page }) => {
  await page.goto("/configuracoes/automacoes")
  await expect(page.getByRole("heading", { name: "Automações administrativas" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Instalar regras recomendadas" })).toBeVisible()
  await expect(
    page.getByText("Execuções recentes").first().or(page.getByText("Nenhuma regra configurada")),
  ).toBeVisible()
  await expect(page.getByText(/Nenhuma mensagem externa é enviada/)).toBeVisible()
})

test("central de pendências é responsiva, filtrável e acessível", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/pendencias")
  await expect(page.getByRole("heading", { name: "Central de pendências" })).toBeVisible()
  await expect(page.getByLabel("Buscar pendência")).toBeVisible()
  await expect(page.getByLabel("Filtrar por prioridade")).toBeVisible()
  await expect(page.getByRole("button", { name: "Exportar CSV" })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
  expect(resultado.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([])
})

test("inteligência local explica o acompanhamento sem prometer previsão", async ({ page }) => {
  await page.goto("/desenvolvimento/inteligencia")
  const painel = page.getByRole("region", { name: "Acompanhamento de permanência" })
  await expect(painel).toBeVisible()
  await expect(painel).toContainText("Não prevê evasão")
  await expect(painel).toContainText("Pontuação local")
  await expect(page.getByRole("heading", { name: "Equidade de oportunidades" })).toBeVisible()
})

test("navegação de desenvolvimento expõe as cinco áreas", async ({ page }) => {
  await page.goto("/desenvolvimento")
  const nav = page.getByRole("navigation", { name: "Áreas de desenvolvimento" })
  for (const nome of ["Visão geral", "Operação", "Treinos", "Famílias", "Inteligência"]) {
    await expect(nav.getByRole("link", { name: nome })).toBeVisible()
  }
})
