import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"
import { resetOperacionalE2E } from "./fixtures"
import { db } from "@/lib/db"

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
    await expect(dialog.getByRole("heading", { name: "Novo evento", exact: true })).toBeVisible()
    await dialog.getByRole("button", { name: /Close|Fechar/i }).first().click()
    await expect(dialog).not.toBeVisible()
  })
})

test.describe("Agenda automática", () => {
  test("mostra treinos semanais e feriado com treino cancelado", async ({ page }) => {
    await page.goto("/agenda?mes=2026-11")
    // 18/11/2026 é quarta: treino da turma "Seg/Qua/Sex" aparece
    await expect(page.locator('[data-dia="2026-11-18"]')).toContainText("Treino")
    // 20/11 é feriado nacional: aparece o feriado e o treino fica cancelado
    const feriado = page.locator('[data-dia="2026-11-20"]')
    await expect(feriado).toContainText("Dia da Consciência Negra")
    await expect(feriado.locator(".line-through").first()).toBeVisible()
    await feriado.click()
    await expect(page.locator('[data-slot="agenda-feriado"]')).toContainText("Dia da Consciência Negra")
    await expect(page.locator('[data-slot="agenda-treino"]').first()).toContainText("Cancelado")
  })

  test("legenda inclui Feriado e Quadra bloqueada", async ({ page }) => {
    await page.goto("/agenda?mes=2026-11")
    const legenda = page.locator('[data-slot="card"]').filter({ hasText: "Legenda" })
    await expect(legenda).toContainText("Feriado")
    await expect(legenda).toContainText("Quadra bloqueada")
  })

  test("bloqueio da quadra cancela treinos e pode ser removido", async ({ page }) => {
    await db.bloqueioQuadra.deleteMany({ where: { motivo: { startsWith: "E2E" } } })
    try {
      await page.goto("/agenda?mes=2026-11")
      // preenche tudo com retry: antes da hidratação o React descarta o valor digitado
      const campos = [
        [page.getByLabel("De", { exact: true }), "2026-11-24"],
        [page.getByLabel("Até (opcional)"), "2026-11-25"],
        [page.getByLabel("Motivo", { exact: true }), "E2E quadra interditada"],
      ] as const
      await expect(async () => {
        for (const [campo, valor] of campos) await campo.fill(valor)
        await page.waitForTimeout(300)
        for (const [campo, valor] of campos) await expect(campo).toHaveValue(valor, { timeout: 500 })
      }).toPass({ timeout: 20_000 })
      await page.getByRole("button", { name: "Bloquear quadra" }).click()

      const bloqueios = page.locator('[data-slot="bloqueios-quadra"]')
      await expect(bloqueios).toContainText("E2E quadra interditada")
      const dia = page.locator('[data-dia="2026-11-24"]')
      await expect(dia).toContainText("Quadra: E2E quadra interditada")
      await expect(dia.locator(".line-through").first()).toBeVisible()

      await bloqueios.getByRole("button", { name: /Remover bloqueio E2E quadra interditada/ }).click()
      await page.getByRole("button", { name: "Confirmar", exact: true }).click()
      await expect(bloqueios).not.toContainText("E2E quadra interditada")
    } finally {
      await db.bloqueioQuadra.deleteMany({ where: { motivo: { startsWith: "E2E" } } })
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
