import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetInadimplenciaE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetInadimplenciaE2E()
  await loginAsAdmin(page)
})

test.describe("Inadimplência — smoke e carregamento", () => {
  test("página carrega com título correto", async ({ page }) => {
    await page.goto("/inadimplencia")
    await expect(page.getByRole("heading", { name: "Inadimplência", exact: true })).toBeVisible()
  })

  test("exibe os três stat cards de resumo", async ({ page }) => {
    await page.goto("/inadimplencia")
    // Os StatCards têm títulos fixos
    await expect(page.getByText(/Total Inadimplentes/i)).toBeVisible()
    await expect(page.getByText(/Valor Total em Aberto/i)).toBeVisible()
    await expect(page.getByText(/Meses Médios de Atraso/i)).toBeVisible()
  })

  test("exibe seção 'Alunos Inadimplentes'", async ({ page }) => {
    await page.goto("/inadimplencia")
    await expect(page.getByRole("heading", { name: /Alunos Inadimplentes/i })).toBeVisible()
  })
})

test.describe("Inadimplência — lista calculada", () => {
  test("inadimplente controlado aparece na tabela", async ({ page }) => {
    await page.goto("/inadimplencia")
    const aluno = page.getByRole("link", { name: "E2E Aluno Inadimplente", exact: true })
    const linha = page.getByRole("row").filter({ has: aluno })
    await expect(linha).toBeVisible()
    await expect(linha).toContainText("Sub-11")
    await expect(linha).toContainText("R$ 175,00")
  })

  test("stat card 'Total Inadimplentes' exibe um número", async ({ page }) => {
    await page.goto("/inadimplencia")
    // O StatCard renderiza um valor (pode ser 0) no CardContent
    const statCard = page.locator('[data-slot="card"]').filter({ hasText: "Total Inadimplentes" })
    const texto = await statCard.locator('[data-slot="card-content"]').textContent()
    // Deve conter dígito ou "0"
    expect(texto).toMatch(/\d/)
  })

  test("stat card 'Valor Total em Aberto' exibe valor em R$", async ({ page }) => {
    await page.goto("/inadimplencia")
    // Valor sempre presente, mesmo quando R$ 0,00
    await expect(page.getByText(/R\$\s*[\d,.]+/).first()).toBeVisible()
  })
})

test.describe("Inadimplência — edge cases", () => {
  test("lista carregada não gera erro de runtime", async ({ page }) => {
    // Sem erros JS
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })
    await page.goto("/inadimplencia")
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(500)
    // Aceita erros de rede mas não erros de runtime do React
    const criticalErrors = errors.filter((e) =>
      /Cannot read|undefined is not|TypeError/.test(e)
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test("navegação direta para /inadimplencia não redireciona para login", async ({ page }) => {
    await page.goto("/inadimplencia")
    await expect(page).not.toHaveURL(/\/login/)
  })
})
