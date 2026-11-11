import { expect, test } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetInadimplenciaE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetInadimplenciaE2E()
  await loginAsAdmin(page)
})

const INADIMPLENTE = "E2E Aluno Inadimplente"

test.describe("Central de pagamentos — lista", () => {
  test("mostra quem deve, com o inadimplente controlado entre os atrasados", async ({ page }) => {
    await page.goto("/pagamentos")
    await expect(page.getByRole("heading", { name: "Pagamentos", level: 1 })).toBeVisible()
    const lista = page.locator('[data-slot="lista-devedores"]')
    await expect(lista.getByText(INADIMPLENTE, { exact: true })).toBeVisible()
    await expect(lista.locator('[data-situacao="atrasada"]').first()).toBeVisible()
  })

  test("busca pelo nome do responsável", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.getByRole("searchbox", { name: /buscar aluno ou responsável/i }).fill("inadimplência e2e")
    const lista = page.locator('[data-slot="lista-devedores"]')
    await expect(lista.getByText(INADIMPLENTE, { exact: true })).toBeVisible()
  })

  test("filtro 'Atrasados' muda a URL e mantém o atrasado", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.getByRole("link", { name: "Atrasados", exact: true }).click()
    await expect(page).toHaveURL(/filtro=atrasados/)
    await expect(page.locator('[data-slot="lista-devedores"]').getByText(INADIMPLENTE, { exact: true })).toBeVisible()
  })

  test("busca sem resultado mostra estado vazio", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.getByRole("searchbox", { name: /buscar aluno ou responsável/i }).fill("zzzz-ninguem")
    await expect(page.getByText("Ninguém encontrado", { exact: false })).toBeVisible()
  })

  test("visão do mês continua disponível com gerar mensalidades", async ({ page }) => {
    await page.goto("/pagamentos")
    await page.getByRole("link", { name: "Mês", exact: true }).click()
    await expect(page).toHaveURL(/filtro=mes/)
    await expect(page.getByRole("button", { name: /Gerar mensalidades/i })).toBeVisible()
  })

  test("cabe em 375px sem rolagem horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/pagamentos")
    await expect(page.locator('[data-slot="lista-devedores"]')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  })
})
