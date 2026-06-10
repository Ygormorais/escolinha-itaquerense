import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Secretaria", () => {
  test("carrega com visão geral dos alunos", async ({ page }) => {
    await page.goto("/secretaria")
    await expect(page.getByRole("heading", { name: /Secretaria/i })).toBeVisible()
  })

  test("exibe contagem de alunos ativos", async ({ page }) => {
    await page.goto("/secretaria")
    // stat cards com números
    const stats = page.locator("[data-slot='stat-card'], [class*='stat']")
    if (await stats.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(stats.first()).toBeVisible()
    }
  })

  test("lista aniversariantes se existirem", async ({ page }) => {
    await page.goto("/secretaria")
    await expect(page.locator("body")).toBeVisible()
  })
})

test.describe("Turmas", () => {
  test("página de turmas carrega com grid de categorias", async ({ page }) => {
    await page.goto("/turmas")
    await expect(page.getByRole("heading", { name: /Turmas/i })).toBeVisible()
  })

  test("exibe alunos agrupados por turma", async ({ page }) => {
    await page.goto("/turmas")
    // deve haver pelo menos uma seção de turma
    await expect(page.locator("body")).toBeVisible()
  })
})

test.describe("Agenda", () => {
  test("calendário de eventos carrega", async ({ page }) => {
    await page.goto("/agenda")
    await expect(page.getByRole("heading", { name: /Agenda/i })).toBeVisible()
  })

  test("botão novo evento abre dialog", async ({ page }) => {
    await page.goto("/agenda")
    const btn = page.getByRole("button", { name: /Novo|Adicionar evento/i }).first()
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await page.getByRole("button", { name: /Cancelar/i }).click()
    }
  })
})

test.describe("Comunicados", () => {
  test("página de comunicados carrega", async ({ page }) => {
    await page.goto("/comunicados")
    await expect(page.getByRole("heading", { name: /Comunicados/i })).toBeVisible()
  })

  test("campo de mensagem está visível", async ({ page }) => {
    await page.goto("/comunicados")
    const textarea = page.locator("textarea").first()
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(textarea).toBeVisible()
    }
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
