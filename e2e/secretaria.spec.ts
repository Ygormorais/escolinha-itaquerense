import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetOperacionalE2E } from "./fixtures"

test.beforeEach(async ({ page }) => {
  await resetOperacionalE2E()
  await loginAsAdmin(page)
})

test.describe("Secretaria", () => {
  test("carrega com visão geral dos alunos", async ({ page }) => {
    await page.goto("/secretaria")
    await expect(page.getByRole("heading", { name: /Secretaria/i })).toBeVisible()
  })

  test("exibe contagem de alunos ativos", async ({ page }) => {
    await page.goto("/secretaria")
    const card = page.locator('[data-slot="card"]').filter({ hasText: "Alunos Ativos" })
    await expect(card).toBeVisible()
    await expect(card.locator('[data-slot="card-content"] p').first()).toHaveText(/\d+/)
  })

  test("lista o aniversariante controlado do dia", async ({ page }) => {
    await page.goto("/secretaria")
    const card = page.locator('[data-slot="card"]').filter({ hasText: "Aniversariantes do Mês" })
    await expect(card).toContainText("E2E faz aniversário hoje")
  })
})

test.describe("Turmas", () => {
  test("página de turmas carrega com grid de categorias", async ({ page }) => {
    await page.goto("/turmas")
    await expect(page.getByRole("heading", { name: /Turmas/i })).toBeVisible()
  })

  test("exibe alunos agrupados por turma", async ({ page }) => {
    await page.goto("/turmas")
    const aluno = page.getByRole("link", { name: "E2E Aluno Operacional", exact: true })
    const turma = page.locator('[data-slot="card"]').filter({ has: aluno })
    await expect(turma).toContainText("Sub-11")
  })
})

test.describe("Agenda", () => {
  test("calendário de eventos carrega", async ({ page }) => {
    await page.goto("/agenda")
    await expect(page.getByRole("heading", { name: /Agenda/i })).toBeVisible()
  })

  test("botão novo evento abre dialog", async ({ page }) => {
    await page.goto("/agenda")
    const hoje = page.getByRole("button", { name: "Hoje", exact: true })
    await expect(async () => {
      await hoje.click()
      await expect(page).toHaveURL(/\/agenda\?mes=\d{4}-\d{2}&dia=\d{4}-\d{2}-\d{2}$/, { timeout: 1_000 })
    }).toPass({ timeout: 30_000 })
    const btn = page.getByRole("button", { name: "Novo", exact: true })
    await expect(btn).toBeVisible()
    await btn.click()
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Novo Evento", exact: true })).toBeVisible()
    await dialog.getByRole("button", { name: /Close|Fechar/i }).first().click()
    await expect(dialog).not.toBeVisible()
  })
})

test.describe("Comunicados", () => {
  test("página de comunicados carrega", async ({ page }) => {
    await page.goto("/comunicados")
    await expect(page.getByRole("heading", { name: /Comunicados/i })).toBeVisible()
  })

  test("campo de mensagem está visível", async ({ page }) => {
    await page.goto("/comunicados")
    await expect(page.getByLabel("Mensagem", { exact: true })).toBeVisible()
  })
})

test.describe("Histórico (logs)", () => {
  test("histórico de atividades carrega", async ({ page }) => {
    await page.goto("/historico")
    await expect(page.getByRole("heading", { name: /Histórico/i })).toBeVisible()
  })
})

test.describe("Uniformes", () => {
  test("página de uniformes carrega", async ({ page }) => {
    await page.goto("/uniformes")
    await expect(page.getByRole("heading", { name: /Uniforme/i })).toBeVisible()
  })
})

test.describe("Recibos", () => {
  test("gerador de recibos carrega", async ({ page }) => {
    await page.goto("/recibos")
    await expect(page.locator("h1")).toContainText("Recibo")
  })
})
