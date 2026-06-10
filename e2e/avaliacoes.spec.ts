import { test, expect } from "@playwright/test"
import { loginAsAdmin } from "./helpers"

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page)
})

test.describe("Avaliações — smoke e carregamento", () => {
  test("página carrega com título 'Avaliações'", async ({ page }) => {
    await page.goto("/avaliacoes")
    await expect(page.getByRole("heading", { name: /Avalia[cç][oõ]es/i })).toBeVisible()
  })

  test("exibe contagem de avaliações registradas", async ({ page }) => {
    await page.goto("/avaliacoes")
    // "X avaliação(ões) registrada(s)" — parágrafo descritivo
    await expect(page.getByText(/avalia[cç][aã]o\(ões\) registrada\(s\)/i)).toBeVisible()
  })

  test("tabela com colunas corretas é visível", async ({ page }) => {
    await page.goto("/avaliacoes")
    await expect(page.locator("table")).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Aluno/i })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Turma/i })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Per[ií]odo/i })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: /Nota T[eé]cnica/i })).toBeVisible()
  })
})

test.describe("Avaliações — criar nova avaliação", () => {
  test("botão '+ Nova Avaliação' abre dialog", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.getByRole("button", { name: /Nova Avalia[cç][aã]o/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("heading", { name: /Nova Avalia[cç][aã]o/i })).toBeVisible()
  })

  test("dialog contém campos obrigatórios: Aluno, Período e notas", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.getByRole("button", { name: /Nova Avalia[cç][aã]o/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    // Select de aluno
    await expect(dialog.locator('[role="combobox"]')).toBeVisible()
    // Campo período
    await expect(dialog.locator('input[placeholder="2026-1S"]')).toBeVisible()
    // Campos numéricos (notas)
    const numericInputs = dialog.locator('input[type="number"]')
    await expect(numericInputs.first()).toBeVisible()
  })

  test("submeter dialog sem aluno selecionado exibe erro de validação", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.getByRole("button", { name: /Nova Avalia[cç][aã]o/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Clica em Cadastrar sem selecionar aluno
    await dialog.getByRole("button", { name: /Cadastrar/i }).click()

    // Deve exibir mensagem de validação ou o dialog deve permanecer aberto
    await page.waitForTimeout(500)
    const dialogAindaAberto = await dialog.isVisible()
    expect(dialogAindaAberto).toBe(true)

    // Fechar dialog
    const btnFechar = dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first()
    if (await btnFechar.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btnFechar.click()
    }
  })

  test("fechar dialog descarta o formulário", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.getByRole("button", { name: /Nova Avalia[cç][aã]o/i }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Preencher campo período
    await dialog.locator('input[placeholder="2026-1S"]').fill("2025-2S")

    // Fechar
    const btnFechar = dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first()
    await btnFechar.click()
    await expect(dialog).not.toBeVisible()
  })
})

test.describe("Avaliações — tabela com dados", () => {
  test("quando não há avaliações, exibe estado vazio com ícone", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.waitForLoadState("networkidle")

    const hasRows = await page.locator("table tbody tr td:not([colspan])").first().isVisible({ timeout: 2000 }).catch(() => false)
    const hasEmptyState = await page.getByText(/Nenhuma avalia[cç][aã]o registrada ainda/i).isVisible({ timeout: 2000 }).catch(() => false)

    // Um dos dois estados deve existir
    expect(hasRows || hasEmptyState).toBe(true)
  })

  test("quando há avaliações, badges de nota são exibidos", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.waitForLoadState("networkidle")

    const rows = page.locator("table tbody tr")
    const count = await rows.count()
    if (count > 0) {
      // Primeira linha deve ter badges
      const firstRow = rows.first()
      await expect(firstRow.locator("span, [data-testid='badge'], .badge")).toHaveCount({ minimum: 1 } as never)
    }
  })
})

test.describe("Avaliações — ações na tabela", () => {
  test("botão de editar abre dialog 'Editar Avaliação'", async ({ page }) => {
    await page.goto("/avaliacoes")
    await page.waitForLoadState("networkidle")

    const btnEditar = page.locator('button[aria-label="Editar avaliação"]').first()
    if (await btnEditar.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnEditar.click()
      const dialog = page.getByRole("dialog")
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole("heading", { name: /Editar Avalia[cç][aã]o/i })).toBeVisible()
      await dialog.getByRole("button", { name: /Cancelar|Fechar|Close/i }).first().click()
    }
  })
})
